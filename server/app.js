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
const request = require('request-promise');
const bcrypt = require('bcrypt');
const { formatPhoneNumberIntl, isValidPhoneNumber } = require('react-phone-number-input');

const StandardMerkleTree = require("@openzeppelin/merkle-tree").StandardMerkleTree;
const tree = require('./tree.js');

dotenv.config({ path: path.join(__dirname, '.env') });

const merkleTree = StandardMerkleTree.load(tree);

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require('twilio')(accountSid, authToken);

const blockchain = require('./blockchain');

const redisClient = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_HOST,
  { password: process.env.REDIS_PASSWORD }
);

// Initialize the DB
console.log(process.env.MYSQL_HOST);
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
directives['default-src'] = ["*", "'self'"];
directives['script-src'] = [ "*", "'self'", "'unsafe-inline'" ];
directives['img-src'] = [ "*", "data:" ];
app.use((req, res, next) => {
  console.log(req.originalUrl);
  next();
});
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives
  }
}));

app.use(cors({
  credentials: true,
  origin: [
    'http://localhost:3000',
    'https://app.cent.dev',
    'https://app.cent.co',
  ],
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

mintCache = {
  ens: {},
};

const lookupENS = async (addresses) => {
  const hitList = {};
  const [matches] = await pool.query(
    `
    SELECT * FROM ens WHERE address IN (${repeat('?', addresses.length)})
    `,
    addresses
  );

  const lookupList = {};
  addresses.forEach(a => lookupList[a] = true);
  const now = new Date().getTime();
  const hour = 60 * 60 * 1000;
  matches.forEach(m => {
    const address = m.address.toLowerCase();
    if (m.name) {
      hitList[address] = m.name;
      mintCache['ens'][address] = m.name;
      delete lookupList[address];
    } else if (now - (new Date(m.last_check_time).getTime()) < hour) {
      delete lookupList[address];
    }
  });
  const values = [];
  const addressesToLookup = Object.keys(lookupList);
  if (addressesToLookup.length > 0) {
    for (const address of addressesToLookup) {
      try {
        const name = await blockchain.getENS(address);
        hitList[address] = name;
        mintCache['ens'][address] = name;
        values.push(address);
        values.push(name);
      } catch (e) {
        values.push(address, null);
      }
    }
    await pool.query(
      `
      INSERT INTO ens (address, name) VALUES ${repeat('(?,?)', values.length / 2)}
      ON DUPLICATE KEY UPDATE last_check_time = NOW()
      `,
      values
    );
  }
  return hitList;
};

app.get('/-/api/ens', async (req, res) => {
  const addresses = (req.query.addresses || '').toLowerCase().split(',');
  if (addresses.length == 0 || addresses[0] == '') {
    jsonResponse(res, null, {});
    return;
  }
  const hitList = await lookupENS(addresses);
  jsonResponse(res, null, hitList);
});

app.get('/-/api/account', async (req, res) => {
  // const contractAddress = (req.query.contractAddress || '').toLowerCase();
  if (req.session.account) {
    const [accounts] = await pool.query(
      `
      SELECT * FROM account WHERE id = ?
      `,
      [ req.session.account.id ]
    );
    jsonResponse(res, null, accounts[0]);
  } else {
    jsonResponse(res, null, null);
  }
});

app.post('/-/api/login', async (req, res) => {
  const { address, signature } = req.body;
  try {
    const loginNonce = req.session.ln;
    if (!loginNonce) {
      throw new Error('Invalid code');
    }
    const message = `Signing in to StreakPoints. Code: ${loginNonce}`;
    const signer = blockchain.recoverSigner(message, signature);
    if (address !== signer) {
      throw new Error('Signature mismatch');
    }
    let verified = false;
    try {
      const name = await blockchain.getENS(address);
      verified = !!name;
    } catch (e) {
      // skip
    }
    await pool.query(
      `
      INSERT INTO account (address, verified) VALUES (?,?)
      ON DUPLICATE KEY UPDATE
        login_time = NOW(),
        verified = IF(verified = FALSE, VALUES(verified), verified)
      `,
      [ address, verified ]
    );
    const [accounts] = await pool.query(
      `
      SELECT * FROM account WHERE address = ?
      `,
      [ address ]
    );
    req.session.account = accounts[0];
    delete req.session.ln;
    jsonResponse(res, null, accounts[0]);
  } catch (e) {
    jsonResponse(res, e);
  }
});

app.get('/-/api/logout', async (req, res) => {
  delete req.session.ln;
  delete req.session.account;
  jsonResponse(res, null, null);
});

app.get('/-/api/login-nonce', async (req, res) => {
  const nonce = Math.floor(Math.random() * 1_000_000);
  req.session.ln = nonce;
  jsonResponse(res, null, nonce);
});

app.get('/-/api/session', async (req, res) => {
  jsonResponse(res, null, req.session);
});

app.post('/-/api/account/verify-start', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!isValidPhoneNumber(phoneNumber)) {
    jsonResponse(res, new Error('Invalid phone number'));
    return;
  }
  const v = await twilioClient.verify.v2.services('VAe8d72203ec5c5edcfbe4d5430205a09f').verifications.create({
    to: phoneNumber,
    channel: 'sms'
  });

  req.session.vid = v.sid;

  jsonResponse(res, null, 'OK');
});

app.post('/-/api/account/verify-complete', async (req, res) => {
  if (!req.session.account) {
    jsonResponse(res, new Error('No account'));
    return;
  }
  const { phoneNumber, phonePin } = req.body;
  if (!isValidPhoneNumber(phoneNumber)) {
    jsonResponse(res, new Error('Invalid phone number'));
    return;
  }
  const vc = await twilioClient.verify.v2.services('VAe8d72203ec5c5edcfbe4d5430205a09f').verificationChecks.create({
    to: phoneNumber,
    code: phonePin
  });
  if (vc.sid !== req.session.vid) {
    jsonResponse(res, null, 'Invalid attempt');
  } else if (!vc.valid || vc.status !== 'approved') {
    jsonResponse(res, null, 'Verification incomplete');
  } else {
    const hash = await blockchain.spSign(formatPhoneNumberIntl(phoneNumber));
    try {
      await pool.query(
        `
        INSERT INTO account_verification (account_id, phone_hash) VALUES (?,?)
        `,
        [ req.session.account.id, hash ]
      );
      await pool.query(
        `
        UPDATE account SET verified = TRUE WHERE id = ?
        `,
        [ req.session.account.id ]
      );
      req.session.account.verified = true;
      jsonResponse(res, null, req.session.account);
    } catch (e) {
      jsonResponse(res, new Error('Unable to verify this phone'));
    }
  }
});

app.get('/-/api/checkin/verify', async (req, res) => {
  if (!req.session.account) {
    jsonResponse(res, new Error('Connect wallet and sign in first'));
  } else if (!req.session.account.verified) {
    jsonResponse(res, new Error('Not verified'));
  } else {
    const { signature, currentEpoch } = await blockchain.verifyCheckin(req.session.account.address);
    jsonResponse(res, null, {
      verification: signature,
      currentEpoch
    });
  }
});

app.get('/-/api/epoch-stats', async (req, res) => {
  const [epochResult] = await pool.query(
    `
    SELECT MAX(epoch) AS epoch FROM checkin
    `
  );
  const maxEpoch = epochResult[0].epoch || 0;
  const [epochResults] = await pool.query(
    `
    SELECT epoch, COUNT(*) AS addresses, SUM(points) AS points
    FROM checkin
    WHERE epoch <= ? AND epoch >= ?
    GROUP BY epoch
    ORDER BY epoch ASC
    `,
    [ maxEpoch, maxEpoch - 6 ]
  );

  jsonResponse(res, null, epochResults);
});

app.get('/-/api/top-points', async (req, res) => {
  const [epochResult] = await pool.query(
    `
    SELECT MAX(epoch) AS epoch FROM checkin
    `
  );
  const maxEpoch = epochResult[0].epoch || 0;
  const [checkinIDResults] = await pool.query(
    `
    SELECT address, MAX(id) AS id, MAX(points) AS points
    FROM checkin
    WHERE epoch = ? OR epoch = ?
    GROUP BY address
    ORDER BY points DESC
    `,
    [ maxEpoch, maxEpoch - 1 ]
  );

  const checkinIDs = checkinIDResults.slice(0, 10).map(checkin => checkin.id);

  if (checkinIDs.length == 0) {
    jsonResponse(res, null, []);
    return;
  }
  const [checkins] = await pool.query(
    `
    SELECT
      checkin.*,
      ens.name,
      UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(create_time) AS elapsed
    FROM checkin
    LEFT JOIN ens ON checkin.address = ens.address
    WHERE checkin.id IN (${`,?`.repeat(checkinIDs.length).slice(1)})
    ORDER BY checkin.points DESC
    `,
    checkinIDs
  );
  jsonResponse(res, null, checkins);
});

app.get('/-/api/top-streaks', async (req, res) => {
  const [epochResult] = await pool.query(
    `
    SELECT MAX(epoch) AS epoch FROM checkin
    `
  );
  const maxEpoch = epochResult[0].epoch || 0;
  const [checkinIDResults] = await pool.query(
    `
    SELECT address, MAX(id) AS id, MAX(streak) AS streak
    FROM checkin
    WHERE epoch = ? OR epoch = ?
    GROUP BY address
    ORDER BY streak DESC
    `,
    [ maxEpoch, maxEpoch - 1 ]
  );

  const checkinIDs = checkinIDResults.slice(0, 10).map(checkin => checkin.id);

  if (checkinIDs.length == 0) {
    jsonResponse(res, null, []);
    return;
  }
  const [checkins] = await pool.query(
    `
    SELECT
      checkin.*,
      ens.name,
      UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(create_time) AS elapsed
    FROM checkin
    LEFT JOIN ens ON checkin.address = ens.address
    WHERE checkin.id IN (${`,?`.repeat(checkinIDs.length).slice(1)})
    ORDER BY checkin.streak DESC
    `,
    checkinIDs
  );
  jsonResponse(res, null, checkins);
});

app.get('/-/api/checkin', async (req, res) => {
  const [checkinIDResults] = await pool.query(
    `
    SELECT address, MAX(id) AS id, MAX(create_time) AS create_time
    FROM checkin
    WHERE create_time > DATE_SUB(NOW(), INTERVAL 2 DAY)
    GROUP BY address
    ORDER BY create_time DESC
    LIMIT 20
    `
  );

  const checkinIDs = checkinIDResults.map(checkin => checkin.id);

  if (checkinIDs.length == 0) {
    jsonResponse(res, null, []);
    return;
  }
  const [checkins] = await pool.query(
    `
    SELECT
      checkin.*,
      ens.name,
      UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(create_time) AS elapsed
    FROM checkin
    LEFT JOIN ens ON checkin.address = ens.address
    WHERE checkin.id IN (${`,?`.repeat(checkinIDs.length).slice(1)})
    ORDER BY checkin.id DESC
    `,
    checkinIDs
  );
  jsonResponse(res, null, checkins);
});

app.get('/-/api/profile', async (req, res) => {
  const { address } = req.query;
  const profileData = {
    checkins: [],
    referrals: [],
    metadata: {},
    ens: null,
  };
  try {
    const [ens] = await pool.query(
      `SELECT * FROM ens WHERE address = ?`,
      [ address ]
    );
    if (ens.length > 0) {
      profileData.ens = ens[0].name;
    }
    const metadata = await blockchain.getAccountData(address);
    profileData.metadata = metadata;
    const [referrals] = await pool.query(
      `
      SELECT
        checkin.*,
        ens.name,
        UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(create_time) AS elapsed
      FROM checkin
      INNER JOIN ens ON checkin.address = ens.address
      WHERE checkin.referrer = ?
      ORDER BY checkin.id DESC
      `,
      [ address ]
    );
    profileData.referrals = referrals;
    const [checkins] = await pool.query(
      `
      SELECT *
      FROM checkin
      WHERE address = ?
      ORDER BY epoch ASC
      `,
      [ address ]
    );
    profileData.checkins = checkins;
    jsonResponse(res, null, profileData);
  } catch (e) {
    jsonResponse(res, new Error('Invalid Data'));
  }
});

app.get('/-/api/last-checkin', async (req, res) => {
  if (!req.session.account) {
    jsonResponse(res, null, 0);
  }
  const { address } = req.session.account;
  const [lastUserCheckin] = await pool.query(
    `
    SELECT MAX(epoch) AS epoch
    FROM checkin
    WHERE address = ?
    `,
    [ address ]
  );
  jsonResponse(res, null, lastUserCheckin[0].epoch);
});

app.get('/warped/:address', async (req, res) => {
  const address = req.params['address'];
  let proof = null;
  let amount = null;
  for (const [i, v] of merkleTree.entries()) {
    if (v[0] === address) {
      amount = v[1];
      proof = merkleTree.getProof(i);
    }
  }
  jsonResponse(res, null, {
    address,
    amount,
    proof,
  });
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
            recipient_score,
            block_num
          ) VALUES ${`,(?,?,?,?,?,?,?)`.repeat(tokens.length).slice(1)}
          `,
          tokens.reduce((acc, val) => acc.concat([
            chainID,
            val.contract,
            val.tokenID,
            val.recipient,
            val.valueGwei,
            val.score,
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

const scanCheckins = async () => {
  const checkins = await blockchain.getCheckins(0);
  if (checkins.length > 0) {
    const values = [];
    checkins.forEach(c => {
      values.push(c.address);
      values.push(c.epoch);
      values.push(c.streak);
      values.push(c.points);
      values.push(c.coins);
      values.push(c.referrer);
      values.push(c.txid);
    });
    await pool.query(
      `
      INSERT INTO checkin (address, epoch, streak, points, sp, referrer, txid)
      VALUES ${`,(?,?,?,?,?,?,?)`.repeat(checkins.length).slice(1)}
      ON DUPLICATE KEY UPDATE txid = VALUES(txid)
      `,
      values
    );
    lookupENS(checkins.map(c => c.address));
  }
  // getSPMined();
};

const getSPMined = async () => {
  const [checkins] = await pool.query(
    `SELECT * FROM checkin WHERE sp IS NULL`
  );
  for (checkin of checkins) {
    const coins = await blockchain.getSPMined(checkin.txid);
    if (coins !== null) {
      await pool.query(
        `UPDATE checkin SET sp = ? WHERE id = ?`,
        [
          coins,
          checkin.id
        ]
      );
    }
  }
};

const CRON_MIN = '* * * * *';
// schedule.scheduleJob(CRON_MIN, scanCheckins);
// scanCheckins();
