const express = require('express');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2/promise');
const redis = require('redis');
const RedisStore = require('connect-redis')(expressSession);
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const ethers = require('ethers');
const dotenv = require('dotenv');
const path = require('path');
const schedule = require('node-schedule');
const request = require("request-promise");

dotenv.config({ path: path.join(__dirname, '.env') });

const blockchain = require('./blockchain');

const redisClient = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_HOST,
  { password: process.env.REDIS_PASSWORD }
);

// Initialize the DB
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0 // No limit
});

const app = express();
const port = 8000;

function jsonResponse(res, error, results) {
  if (error) {
    res.status(500);
    res.set('content-type', 'application/json');
    res.send({
      errors: [error.toString()]
    });
  }
  else {
    res.status(200);
    res.set('content-type', 'application/json');
    res.send(JSON.stringify({
      results: results
    }));
  }
}

function repeat(template, occurences) {
  return `,${template}`.repeat(occurences).slice(1);
}

const directives = helmet.contentSecurityPolicy.getDefaultDirectives();
directives['default-src'] = [ "'self'", "api.opensea.io", "platform.twitter.com", "*.fontawesome.com", "fqk5crurzsicvoqpw67ghzmpda0xjyng.lambda-url.us-west-2.on.aws", "data:" ];
directives['script-src'] = [ "'self'", "'unsafe-inline'", "platform.twitter.com", "*.fontawesome.com" ];
directives['img-src'] = [ "*", "data:" ];
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives
  }
}));

app.use(cors({
  credentials: true,
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));

app.use(cookieParser());
app.use(expressSession({
  secret: process.env.REDIS_SECRET,
  store: new RedisStore({
    client: redisClient
  }),
  cookie: {
    // Browser-session cookie
    maxAge: 2147483647
  },
  // Don't save the session until we modify it
  saveUninitialized: false,
  resave: false
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('build'));

const chainIDs = [1, 137, 7777777];
const chains = {
  ethereum: 1,
  polygon: 137,
  zora: 7777777,
};
const mintCache = {
  all: [],
  agg: {
    1: [],
    137: [],
    7777777: [],
  }
};
chainIDs.forEach(chainID => mintCache[chainID] = {});

app.get('/-/api/feed', async (req, res) => {
  const chain = req.query.chain || 'ethereum';
  const chainID = chains[chain];
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const offset = parseInt(req.query.offset) || 0;
  const range = req.query.range;
  let rangeMinutes = null;
  switch (range) {
    case 'minute':
      rangeMinutes = 1;
      break;
    case 'hour':
      rangeMinutes = 60;
      break;
    case 'day':
      rangeMinutes = 60 * 24;
      break;
    case 'week':
      rangeMinutes = 60 * 24 * 7;
      break;
    default:
      jsonResponse(res, new Error('Invalid Range'));
      return;
  }
  if (chainIDs.indexOf(chainID) < 0) {
    jsonResponse(res, new Error('Invalid Chain'));
    return;
  }
  const mints = (mintCache[chainID][rangeMinutes] || []).slice(offset, offset + limit);
  if (mints.length == 0) {
    jsonResponse(res, null, {
      mints: [],
      collections: [],
    });
  } else {
    const [collections] = await pool.query(
      `
      SELECT *
      FROM collection
      WHERE contract_address IN (${`,?`.repeat(mints.length).slice(1)})
      `,
      mints.map(m => m.contract_address),
    );
    jsonResponse(res, null, {
      mints,
      collections,
    });
  }
});

app.get('/-/api/tokens/recent', async (req, res) => {
  jsonResponse(res, null, mintCache['agg']);
});

app.get('/-/api/collection-owners', async (req, res) => {
  const collectionAddress = (req.query.collectionAddress || '').toLowerCase();
  const [recipients] = await pool.query(
    `
    SELECT DISTINCT recipient
    FROM mint
    WHERE contract_address = ?
    LIMIT 10000
    `,
    [ collectionAddress ]
  );
  jsonResponse(res, null, recipients);
});

app.get('/-/api/tokens', async (req, res) => {
  const chain = req.query.chain || 'ethereum';
  const chainID = chains[chain];
  const contractAddress = req.query.contractAddress;
  const limit = Math.min(parseInt(req.query.limit) || 10, 9);
  const offset = parseInt(req.query.offset) || 0;
  if (chainIDs.indexOf(chainID) < 0) {
    jsonResponse(res, new Error('Invalid Chain'));
    return;
  }
  const [mints] = await pool.query(
    `
    SELECT *
    FROM mint
    WHERE chain_id = ? AND contract_address = ?
    ORDER BY id DESC
    LIMIT ?,?
    `,
    [
      chainID,
      contractAddress,
      offset,
      limit
    ]
  );
  await Promise.all(mints.map(async (mint) => {
    mint.token_uri = await blockchain.getTokenURI(mint.chain_id, mint.contract_address, mint.token_id);
  }));
  jsonResponse(res, null, {
    mints,
  });
});

app.get('/-/api/user-graph', async (req, res) => {
  const recipient = req.query.userAddress;
  const [userMints] = await pool.query(
    `
    SELECT * FROM mint WHERE recipient = ?
    `,
    [ recipient ]
  );
  const collectionMap = {};
  userMints.forEach(m => collectionMap[m.contract_address] = {
    contract_address: m.contract_address,
    token_id: m.token_id,
    chain_id: m.chain_id,
  });
  // mint.token_uri = await blockchain.getTokenURI(mint.chain_id, mint.contract_address, mint.token_id);
  const collections = Object.keys(collectionMap);
  const [collectionMints] = await pool.query(
    `
    SELECT contract_address, recipient, value_gwei
    FROM mint
    WHERE contract_address IN (${`,?`.repeat(collections.length).slice(1)})
    `,
    collections
  );
  jsonResponse(res, null, { collectionMints, userMints });
});

app.get('/-/api/overlap', async (req, res) => {
  const chain = req.query.chain || 'ethereum';
  const chainID = chains[chain];
  const contractAddress = req.query.contractAddress;
  if (chainIDs.indexOf(chainID) < 0) {
    jsonResponse(res, new Error('Invalid Chain'));
    return;
  }
  const [recipients] = await pool.query(
    `
    SELECT DISTINCT recipient
    FROM mint
    WHERE contract_address = ?
    LIMIT 10000
    `,
    [ contractAddress ]
  );
  const recipientMap = {};
  recipients.forEach(r => recipientMap[r.recipient] = true);
  const statMap = {};
  mintCache['all'].forEach(m => {
    if (m.contract_address != contractAddress && recipientMap[m.recipient]) {
      if (!statMap[m.contract_address]) {
        statMap[m.contract_address] = {
          counter: 0,
          spent: 0,
          chain_id: m.chain_id,
        };
      }
      statMap[m.contract_address].counter++;
      statMap[m.contract_address].spent += m.value_gwei;
    }
  });
  const stats = Object.keys(statMap)
  .sort((contractA, contractB) => statMap[contractA].counter > statMap[contractB].counter ? -1 : 1)
  .slice(0, 100) // top 100
  .map(contract_address => ({
    contract_address,
    num_collectors: statMap[contract_address].counter,
    spent: statMap[contract_address].spent,
    chain_id: statMap[contract_address].chain_id,
  }));
  const [collections] = await pool.query(
    `
    SELECT *
    FROM collection
    WHERE contract_address IN (${`,?`.repeat(stats.length + 1).slice(1)})
    `,
    stats.map(m => m.contract_address).concat([contractAddress]),
  );
  jsonResponse(res, null, {
    stats,
    collections,
  });
});

const getCastHash = async (user, hashPrefix) => {
  const response = await request(`https://client.warpcast.com/v2/user-thread-casts?castHashPrefix=${hashPrefix}&username=${user}&limit=1`);
  const casts = JSON.parse(response).result.casts;
  if (casts.length == 0) {
    throw new Error('Cast not found');
  } else {
    const [existing] = await pool.query(
      `
      SELECT * FROM farcast WHERE hash = ?
      `,
      [
        casts[0].hash
      ]
    );
    if (existing.length > 0) {
      throw new Error('Already recast');
    }
    return casts[0].hash;
  }
};

app.post('/-/api/check-cast', async (req, res) => {
  const { user, hashPrefix } = req.body;
  try {
    const hash = await getCastHash(user, hashPrefix);
    jsonResponse(res, null, 'OK');
  } catch (e) {
    jsonResponse(res, e);
  }
});

app.post('/-/api/recast', async (req, res) => {
  const { user, hashPrefix, txid } = req.body;
  try {
    const hash = await getCastHash(user, hashPrefix);
    const result = await pool.query(
      `
      INSERT INTO farcast (hash, txid, status) VALUES (?,?, "PEND")
      `,
      [
        hash,
        txid
      ]
    );
    jsonResponse(res, null, 'OK');
  } catch (e) {
    jsonResponse(res, e);
  }
});

app.get('/-/api/status', async (req, res) => {
  jsonResponse(res, null, 'OK');
});

app.get('/*', async (req, res) => {
  res.sendFile(path.resolve(__dirname, '../build/index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
});

const scanChains = async () => {
  await Promise.all(chainIDs.map(async (chainID) => {
    try {
      const start = new Date().getTime() / 1000;
      const [result] = await pool.query(
        `
        SELECT COALESCE(MAX(block_num), 0) AS last_block
        FROM mint
        WHERE chain_id = ?
        `,
        [ chainID ]
      );
      const tokens = await blockchain.getMints(chainID, result[0].last_block);
      const mid = new Date().getTime() / 1000;
      if (tokens.length > 0) {
        const collectionMap = {};
        tokens.forEach(t => collectionMap[t.contract.toLowerCase()] = true);
        const collectionAddresses = Object.keys(collectionMap);

        const [existingCollections] = await pool.query(
          `
          SELECT contract_address
          FROM collection
          WHERE chain_id = ? AND contract_address IN (${`,?`.repeat(collectionAddresses.length).slice(1)})
          `,
          [ chainID ].concat(collectionAddresses)
        );
        const ecMap = {};
        existingCollections.forEach(ec => ecMap[ec.contract_address.toLowerCase()] = true);

        const newCollections = collectionAddresses.filter(ca => !ecMap[ca]);
        const collections = await blockchain.getCollections(chainID, collectionAddresses);
        await pool.query(
          `
          INSERT IGNORE INTO collection (
            chain_id,
            contract_address,
            name
          ) VALUES ${`,(?,?,?)`.repeat(collections.length).slice(1)}
          `,
          collections.reduce((acc, val) => acc.concat([
            chainID,
            val.contract,
            val.name,
          ]), [])
        );
        await pool.query(
          `
          INSERT IGNORE INTO mint (
            chain_id,
            contract_address,
            token_id,
            recipient,
            value_gwei,
            block_num
          ) VALUES ${`,(?,?,?,?,?,?)`.repeat(tokens.length).slice(1)}
          `,
          tokens.reduce((acc, val) => acc.concat([
            chainID,
            val.contract,
            val.tokenID,
            val.recipient,
            val.valueGwei,
            val.blockNum,
          ]), [])
        );
      }
      const end = new Date().getTime() / 1000;
      console.log(`CHAIN: ${chainID}\tINDEXED IN: ${(end - start).toFixed(3)}`);
    } catch (e) {
      console.log(`CRON ERROR CHAIN ${chainID}: ${e.message}`);
    }
  }));
};

const genFeeds = async () => {
  const startY = new Date().getTime() / 1000;
  const [results] = await pool.query(
    `
    SELECT chain_id, contract_address, recipient, value_gwei
    FROM mint
    ORDER BY id DESC
    LIMIT 1000000
    `,
    []
  );
  const endY = new Date().getTime() / 1000;
  console.log(`1M MINTS\tFETCHED IN: ${(endY - startY).toFixed(3)}`);
  mintCache['all'] = results;

  mintCache['agg'] = {
    1: {
      u: [],
      c: [],
    },
    137: {
      u: [],
      c: [],
    },
    7777777: {
      u: [],
      c: [],
    },
    contracts: [],
    recipients: [],
  };
  let recipientCounter = 0;
  const recipientMap = {};
  const recipients = [];
  let contractCounter = 0;
  const contractMap = {};
  const contracts = [];
  results.forEach(r => {
    if (!recipientMap[r.recipient]) {
      recipientMap[r.recipient] = ++recipientCounter;
      recipients.push(r.recipient);
    }
    if (!contractMap[r.contract_address]) {
      contractMap[r.contract_address] = ++contractCounter;
      contracts.push(r.contract_address);
    }
    mintCache['agg'][r.chain_id].u.push(recipientMap[r.recipient]);
    mintCache['agg'][r.chain_id].c.push(contractMap[r.contract_address]);
  });
  mintCache['agg'].contracts = contracts;
  mintCache['agg'].recipients = recipients;

  for (const chainID of chainIDs) {
    const ranges = [
      60,
      60 * 24,
      // 60 * 24 * 7
    ];
    const start = new Date().getTime() / 1000;
    for (const range of ranges) {
      try {
        const [results] = await pool.query(
          `
          SELECT contract_address, COUNT(DISTINCT recipient) AS total, SUM(value_gwei) AS spent
          FROM mint
          USE INDEX (feed)
          WHERE
            chain_id = ? AND
            create_time > DATE_SUB(NOW(), INTERVAL ? MINUTE)
          GROUP BY contract_address
          ORDER BY spent DESC, total DESC
          LIMIT 300
          `,
          [
            chainID,
            range
          ]
        );
        mintCache[chainID][range] = results;
      } catch (e) {
        break;
      }
    }
    const end = new Date().getTime() / 1000;
    console.log(`CHAIN: ${chainID}\tRANKED IN: ${(end - start).toFixed(3)}`);
  }
};

const scanCasts = async () => {
  const [casts] = await pool.query(
    `
    SELECT hash, txid
    FROM farcast
    WHERE status = "PEND" AND txid IS NOT NULL
    `,
    []
  );
  await Promise.all(casts.map(async (cast) => {
    const txn = await blockchain.getEthTransaction(cast.txid);
    if (txn) {

      const value = parseFloat(ethers.utils.formatEther(txn.value));
      if (value > 0.0001 && txn.to == '0x0000000000000000000000000000000000000000') {
        await blockchain.recast(cast.hash);
        await pool.query(
          `
          UPDATE farcast SET status = "CONF" WHERE txid = ?
          `,
          [
            cast.txid
          ]
        );
      } else {
        await pool.query(
          `
          UPDATE farcast SET status = "FAIL" WHERE txid = ?
          `,
          [
            cast.txid
          ]
        );
      }
    }
  }));
};


const CRON_MIN = '* * * * *';
const CRON_5MIN = '*/5 * * * *';
schedule.scheduleJob(CRON_MIN, scanCasts);
schedule.scheduleJob(CRON_MIN, scanChains);
schedule.scheduleJob(CRON_5MIN, genFeeds);
genFeeds();
