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
directives['default-src'] = [ "'self'", "api.opensea.io", "platform.twitter.com", "*.fontawesome.com" ];
directives['script-src'] = [ "'self'", "'unsafe-inline'", "platform.twitter.com", "*.fontawesome.com" ];
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

app.get('/-/api/feed', async (req, res) => {
  const chain = parseInt(req.query.chain) || 0;
  const range = parseInt(req.query.range) || 1440;
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const offset = parseInt(req.query.offset) || 0;
  const [mints] = await pool.query(
    `
    SELECT contract_address, COUNT(*) AS total
    FROM mint
    WHERE
      chain_id ${chain ? '=' : '!='} ? AND
      create_time > DATE_SUB(NOW(), INTERVAL ? MINUTE)
    GROUP BY contract_address
    ORDER BY COUNT(*) DESC
    LIMIT ?,?
    `,
    [
      chain,
      range,
      offset,
      limit
    ]
  );
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


app.get('/-/api/status', async (req, res) => {
  jsonResponse(res, null, 'OK');
});

app.get('/*', async (req, res) => {
  res.sendFile(path.resolve(__dirname, '../build/index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
});

const CRON_30S = '*/30 * * * * *';
const scheduledJob = schedule.scheduleJob(CRON_30S, function () {
  [1, 137].forEach(async (chainID) => {
    try {
      const [result] = await pool.query(
        `
        SELECT COALESCE(MAX(block_num), 0) AS last_block
        FROM mint
        WHERE chain_id = ?
        `,
        [ chainID ]
      );
      const tokens = await blockchain.getMints(chainID, result[0].last_block);
      if (tokens.length > 0) {
        const collectionMap = {};
        tokens.forEach(t => collectionMap[t.contract] = true);
        const collections = await blockchain.getCollections(chainID, Object.keys(collectionMap));
        await pool.query(
          `
          INSERT INTO collection (
            chain_id,
            contract_address,
            name
          ) VALUES ${`,(?,?,?)`.repeat(collections.length).slice(1)}
          ON DUPLICATE KEY UPDATE id=id
          `,
          collections.reduce((acc, val) => acc.concat([
            chainID,
            val.contract,
            val.name,
          ]), [])
        );
        await pool.query(
          `
          INSERT INTO mint (
            chain_id,
            contract_address,
            token_id,
            recipient,
            block_num
          ) VALUES ${`,(?,?,?,?,?)`.repeat(tokens.length).slice(1)}
          ON DUPLICATE KEY UPDATE id=id
          `,
          tokens.reduce((acc, val) => acc.concat([
            chainID,
            val.contract,
            val.tokenID,
            val.recipient,
            val.blockNum,
          ]), [])
        );
      }
    } catch (e) {
      console.log(`CRON ERROR CHAIN ${chainID}: ${e.message}`);
    }
  });
});

