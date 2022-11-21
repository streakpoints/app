const express = require('express');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2/promise');
const redis = require('redis');
const RedisStore = require('connect-redis')(expressSession);
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const TwitterApi = require('twitter-api-v2').TwitterApi;
const passport = require('passport');
const Strategy = require('passport-twitter').Strategy;
const Base64 = require('js-base64');
const FormData = require('form-data');
const ethers = require('ethers');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const twitterValidator = require('twitter-text');
const textToImage = require('text-to-image');

dotenv.config({ path: path.join(__dirname, '.env') });

const blockchain = require('./blockchain');
const media = require('./media');

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
app.use((req, res, next) => {
  // Read-only clone of session.user
  req.passportUser = req.session.passport
    ? Object.assign({}, req.session.passport.user)
    : null
  ;
  return next();
});


passport.use(new Strategy({
  consumerKey: process.env.TWITTER_APP_KEY,
  consumerSecret: process.env.TWITTER_APP_SECRET,
  callbackURL: '/-/api/auth/twitter/callback',
  proxy: true
}, async (token, tokenSecret, profile, cb) => {
  let results = {};
  try {
    const twitter = new TwitterApi({
      appKey: process.env.TWITTER_APP_KEY,
      appSecret: process.env.TWITTER_APP_SECRET,
      accessToken: token,
      accessSecret: tokenSecret
    });
    results = await twitter.v1.verifyCredentials({
      include_entities: false,
      include_email: false,
      skip_status: true
    });
    await pool.query(
      `
      INSERT INTO twitter_account (
        id,
        handle,
        name,
        description,
        profile_image_url,
        verified,
        protected
      ) VALUES (?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        handle = VALUES(handle),
        name = VALUES(name),
        description = VALUES(description),
        profile_image_url = VALUES(profile_image_url),
        verified = VALUES(verified),
        protected = VALUES(protected)
      `,
      [
        results.id_str,
        results.screen_name,
        results.name,
        results.description,
        results.profile_image_url,
        results.verified,
        results.protected
      ]
    );
    await pool.query(
      `
      INSERT INTO twitter_account_keys (
        twitter_account_id,
        access_key,
        access_secret
      ) VALUES (?,?,?)
      ON DUPLICATE KEY UPDATE
        access_key = VALUES(access_key),
        access_secret = VALUES(access_secret)
      `,
      [
        results.id_str,
        token,
        tokenSecret
      ]
    );
  }
  catch (e) {
    console.log(e.message);
  }
  return cb(null, {
    id: results.id_str,
    name: results.screen_name
  });
}));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

function authRequired(req, res, next) {
  if (req.passportUser) {
    return next();
  }
  jsonResponse(res, new Error('Not authenticated'), null);
}

app.get('/-/api/auth/user', async (req, res) => jsonResponse(res, null, req.passportUser));
app.get('/-/api/auth/twitter/init', passport.authenticate('twitter'));
app.get('/-/api/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/?failure' }), (req, res) => {
  if (process.env.NODE_ENV === 'dev') {
    res.redirect('http://localhost:3000/i');
  }
  else {
    res.redirect('/i');
  }
});
app.get('/-/api/auth/logout', async (req, res) => {
  req.session.destroy();
  jsonResponse(res, null, "OK");
});

app.get('/-/api/twitter-account', async (req, res) => {
  const {
    twitterAccountQuery,
    twitterAccountHandle
  } = req.query;
  if (twitterAccountQuery) {
    const [result] = await pool.query(`SELECT * FROM twitter_account WHERE handle LIKE ?`, [`%${twitterAccountQuery}%`]);
    jsonResponse(res, null, result);
  }
  else if (twitterAccountHandle) {
    const [result] = await pool.query(`SELECT * FROM twitter_account WHERE handle = ?`, [twitterAccountHandle]);
    jsonResponse(res, null, result);
  }
  else {
    const [result] = await pool.query(`SELECT * FROM twitter_account WHERE nft_channel_active IS TRUE`);
    jsonResponse(res, null, result);
  }
});

app.get('/-/api/twitter-account/rule', async (req, res) => {
  const {
    twitterAccountID
  } = req.query;
  const [result] = await pool.query(`SELECT * FROM twitter_account_rule WHERE twitter_account_id = ?`, [twitterAccountID]);
  jsonResponse(res, null, result);
});

app.get('/-/api/tweet-token', async (req, res) => {
  const {
    twitterAccountID,
    offset,
    limit
  } = req.query;
  try {
    if (twitterAccountID) {
      const [result] = await pool.query(
        `
        SELECT * FROM tweet_token
        INNER JOIN twitter_account ON twitter_account.id = tweet_token.twitter_account_id
        WHERE twitter_account.protected IS FALSE AND twitter_account.id = ?
        ORDER BY tweet_token.create_time DESC LIMIT ?,?`,
        [ twitterAccountID, offset || 0, limit || 12 ]
      );
      jsonResponse(res, null, result);
    }
    else {
      const [result] = await pool.query(
        `
        SELECT * FROM tweet_token
        INNER JOIN twitter_account ON twitter_account.id = tweet_token.twitter_account_id
        WHERE twitter_account.protected IS FALSE
        ORDER BY tweet_token.create_time DESC limit ?,?`,
        [ offset || 0, limit || 12 ]
      );
      jsonResponse(res, null, result);
    }
  }
  catch (e) {
    console.log(e.message);
    jsonResponse(res, e);
  }
});

app.post('/-/api/twitter-account/rule', async (req, res) => {
  const {
    allowAll,
    accessControlList,
    authorizedAddress
  } = req.body;
  const twitterAccountID = req.passportUser.id;
  if (!twitterAccountID) {
    jsonResponse(res, new Error('Not authenticated'), null);
    return;
  }
  try {
    const rules = [];
    if (authorizedAddress) {
      if (allowAll) {
        // Add the NFT contract
        rules.push(twitterAccountID, authorizedAddress, '*', true);

        // Add the block list
        if (accessControlList !== undefined) {
          accessControlList.split(',').forEach(tokenID =>
            rules.push(twitterAccountID, authorizedAddress, tokenID, false)
          );
        }
      }
      else if (accessControlList !== undefined) {
        // Add the allow list
        accessControlList.split(',').forEach(tokenID =>
          rules.push(twitterAccountID, authorizedAddress, tokenID, true)
        );
      }
    }
    else {
      // Add the address
      if (accessControlList !== undefined) {
        accessControlList.split(',').forEach(address =>
          rules.push(twitterAccountID, address, null, true)
        );
      }
    }
    if (rules.length > 1001) {
      throw new Error('Max 1000 entries allowed');
    }
    await pool.query(
      `
      DELETE FROM twitter_account_rule
      WHERE twitter_account_id = ?
      `,
      [ twitterAccountID ]
    );
    if (rules.length > 0) {
      await pool.query(
        `
        INSERT INTO twitter_account_rule (
          twitter_account_id,
          eth_address,
          token_id,
          is_allowed
        )
        VALUES ${repeat('(?,?,?,?)', rules.length / 4)}
        `,
        rules
      );
    }
    jsonResponse(res, null, null);
  }
  catch (e) {
    jsonResponse(res, e, null);
  }
});

app.post('/-/api/tweet-token', async (req, res) => {
  const {
    twitterAccountID,
    authorizedAddress,
    authorizedTokenID,
    networkID,
    tokenURI,
    royaltyRate,
    royaltyOwner,
    tweetMessage,
    messageSigner,
    messageSignature
  } = req.body;
  try {
    /**
     * 1. Verify token/signer is accepted by twitter account
     */
    const [accountRules] = await pool.query(
      `
      SELECT * FROM twitter_account_rule
      WHERE twitter_account_id = ? AND eth_address IN(?, "*")
      `,
      [ twitterAccountID, authorizedAddress ]
    );

    if (accountRules.length == 0) {
      throw new Error('Address or contract not authorized');
    }

    const NFTGateRules = accountRules.filter(r => r.token_id != null);
    if (NFTGateRules.length > 0) {
      if (!authorizedTokenID || authorizedTokenID.length == 0) {
        throw new Error('Invalid Token ID');
      }
      const allowMatches = NFTGateRules.filter(r => (r.is_allowed && r.token_id == authorizedTokenID));
      const banMatches = NFTGateRules.filter(r => (!r.is_allowed && r.token_id == authorizedTokenID));
      const allowAll = NFTGateRules.filter(r => (r.is_allowed && r.token_id == '*')).length > 0;
      if (banMatches.length > 0) {
        // Token blocked. (You can block if you "allow all" by default)
        throw new Error('Token Blocked');
      }
      if (!allowAll && allowMatches.length == 0) {
        throw new Error('Token Not Authorized');
      }
    }

    if (accountRules.filter(r => (r.token_id == '*' || !r.token_id) && r.is_allowed).length == 0) {
      // Token collection and/or Address have not been blanket approved
      if (accountRules.filter(r => r.token_id == authorizedTokenID && r.is_allowed).length == 0) {
        // Exact token not allowed match
        throw new Error('Token Not Authorized');
      }
    }
    else {
      // Address gated
      const banMatches = accountRules.filter(r => (!r.is_allowed && r.eth_address == authorizedAddress));
      if (banMatches.length > 0) {
        throw new Error('Address Blocked');
      }
    }

    /**
     * 2. Verify the signature is valid and identify the owner/token
     */
    const broadcastIdentifier = await blockchain.verifyMessageSignatureAndOwner(
      authorizedAddress,
      authorizedTokenID,
      networkID,
      tweetMessage,
      messageSigner,
      messageSignature
    );

    /**
     * 3. Validate the tweet
     */
    let editedTweet = tweetMessage;
    // let hashtags = twitterValidator.extractHashtagsWithIndices(editedTweet);
    // for (let i = hashtags.length; i > 0; i--) {
    //   const tag = hashtags[i - 1];
    //   editedTweet = editedTweet.substr(0, tag.indices[0]) + '#​' + editedTweet.substr(tag.indices[0] + 1);
    // }
    // let mentions = twitterValidator.extractMentionsWithIndices(editedTweet);
    // for (let i = mentions.length; i > 0; i--) {
    //   const tag = mentions[i - 1];
    //   editedTweet = editedTweet.substr(0, tag.indices[0]) + '@​' + editedTweet.substr(tag.indices[0] + 1);
    // }

    // editedTweet = `${editedTweet}\n\n-- ${broadcastIdentifier}\nID ${tokenID}`

    if (!twitterValidator.parseTweet(editedTweet).valid) {
      throw new Error('Tweet too long');
    }

    /**
     * 4. Grab the twitter credentials and tweet
     */
    const [twitterAccountKeys] = await pool.query(
      `
      SELECT * FROM twitter_account_keys
      WHERE twitter_account_id = ?
      `,
      [ twitterAccountID ]
    );
    const twitter = new TwitterApi({
      appKey: process.env.TWITTER_APP_KEY,
      appSecret: process.env.TWITTER_APP_SECRET,
      accessToken: twitterAccountKeys[0].access_key,
      accessSecret: twitterAccountKeys[0].access_secret
    });

    // const mediaID = await twitter.v1.uploadMedia(imageCapture.data, { type: 'png' });
    const tweet = await twitter.v2.tweet({
      text: editedTweet
    });

    /**
     * 5. Save tweet_token to database
     */
    await pool.query(
      `
      INSERT INTO tweet_token (
        tweet_id,
        twitter_account_id,
        authorized_token_id,
        authorized_address,
        token_id,
        token_uri,
        token_memo,
        token_royalty,
        token_address,
        token_signer,
        token_signature
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `,
      [
        tweet.data.id,
        twitterAccountID,
        authorizedTokenID,
        authorizedAddress,
        '-',
        '-',
        tweetMessage,
        0,
        '-',
        messageSigner,
        messageSignature
      ]
    );

    jsonResponse(res, null, tweet.data.id);
  }
  catch (e) {
    console.log(e.message);
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
