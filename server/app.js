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
directives['default-src'] = [ "'self'", "api.opensea.io", "platform.twitter.com" ];
directives['script-src'] = [ "'self'", "'unsafe-inline'", "platform.twitter.com" ];
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
  if (twitterAccountID) {
    const [result] = await pool.query(
      `
      SELECT * FROM tweet_token, twitter_account
      INNER JOIN twitter_account ON twitter_account.id = tweet_token.twitter_account_id
      WHERE twitter_account.protected IS FALSE AND twitter_account_id = ?
      ORDER BY create_time DESC LIMIT ?,?`,
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
      ORDER BY create_time DESC limit ?,?`,
      [ offset || 0, limit || 12 ]
    );
    jsonResponse(res, null, result);
  }
});

app.post('/-/api/twitter-account/rule', async (req, res) => {
  const {
    allowAll,
    allowList,
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
        rules.push(twitterAccountID, authorizedAddress, '*', true);
      }
      else if (allowList !== undefined) {
        allowList.split(',').forEach(tokenID =>
          rules.push(twitterAccountID, authorizedAddress, tokenID, true)
        );
      }
    }
    else {
      if (allowList !== undefined) {
        allowList.split(',').forEach(address =>
          rules.push(twitterAccountID, address, null, true)
        );
      }
    }
    if (rules.length > 50) {
      throw new Error('Max 50 entries allowed');
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

// Caches urls
const capturePost = (url, responseType) => {
  return axios({
    method: 'GET',
    url: 'https://api.urlbox.io/v1/3u7q126M7c8EpwyM/png',
    responseType,
    params: {
      url,
      selector: '.loaded',
      fail_if_selector_missing: true
    }
  });
};

app.post('/-/api/tweet-token/uri', async (req, res) => {
  const {
    networkID,
    authorizedTokenID,
    authorizedAddress,
    twitterAccountID,
    tweetMessage
  } = req.body;
  try {
    // 1. Check that the twitter account allows the specified address
    const [twitterAccountRules] = await pool.query(
      `
      SELECT * FROM twitter_account_rule
      WHERE twitter_account_id = ? AND eth_address = ? AND is_allowed IS TRUE
      `,
      [ twitterAccountID, authorizedAddress ]
    );
    if (twitterAccountRules.length == 0) {
      throw new Error('Collection Not Authorized');
    }

    // 2. Prepare the metadata
    const broadcastIdentifier = await blockchain.getBroadcastIdentifier(authorizedAddress, authorizedTokenID, networkID);
    const tokenName = `${broadcastIdentifier} ${new Date().toISOString().replace('T', ' ').split('.')[0]}`;
    const tokenFrame = `https://embed-renderer.s3.us-west-2.amazonaws.com/721.html?${encodeURIComponent(tweetMessage)}`;

    // 3. Capture the image of the post, store on IPFS
    const imageForm = new FormData();
    const imageCapture = await capturePost(tokenFrame, 'stream');
    imageForm.append('file', imageCapture.data, { filename: 'screenshot.png' });
    const imageUpload = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', imageForm, {
      withCredentials: true,
      maxContentLength: Infinity, //this is needed to prevent axios from erroring out with large files
      maxBodyLength: Infinity,
      headers: {
        'Content-type': `multipart/form-data; boundary=${imageForm.getBoundary()}`,
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_API_SECRET,
      }
    });
    const imageURI = `ipfs://${imageUpload.data.IpfsHash}`;

    // 4. Store the actual post on IPFS
    const animationForm = new FormData();
    animationForm.append('file', media.generate721HTML(tokenFrame), { filename: 'token.html', contentType: 'text/html' });
    const animationUpload = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', animationForm, {
      withCredentials: true,
      maxContentLength: Infinity, //this is needed to prevent axios from erroring out with large files
      maxBodyLength: Infinity,
      headers: {
        'Content-type': `multipart/form-data; boundary=${animationForm.getBoundary()}`,
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_API_SECRET,
      }
    });
    const animationURI = `ipfs://${animationUpload.data.IpfsHash}`;

    // 5. Store the token metadata as a JSON on IPFS, referencing the html files just stored
    const metadataUpload = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      name: tokenName,
      image: imageURI,
      description: tweetMessage,
      animation_url: animationURI,
      external_url: 'https://721.am'
    }, {
      withCredentials: true,
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_API_SECRET,
      }
    });
    const tokenURI = `ipfs://${metadataUpload.data.IpfsHash}`;

    jsonResponse(res, null, tokenURI);
  }
  catch (e) {
    console.log(e.message);
    jsonResponse(res, e);
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
      WHERE twitter_account_id = ? AND eth_address = ?
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
        // Token blocked. You can block if you "allow all" by default
        throw new Error('Token Blocked');
      }
      if (!allowAll && allowMatches.length > 0) {
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

    /**
     * 2. Validate and format the arguments passed in the message
     */
    const messageMemo = tweetMessage;
    if (/^1[0-9]{1,2}.[0-9]{2}$/.test(royaltyRate) == false || parseFloat(royaltyRate) > 100.00) {
      throw new Error('Invalid royalty');
    }
    const [
      messageRoyaltyRateInteger,
      messageRoyaltyRateDecimal
    ] = royaltyRate.split('.');
    const messageRoyaltyOwner = ethers.utils.getAddress(royaltyOwner); // Check address; throws if invalid
    const messageTokenURI = tokenURI;
    const message = (
      tweetMessage
      + '\n\n-------'
      + '\n\nRoyalty Rate\n' + royaltyRate + '%'
      + '\n\nRoyalty Owner\n' + royaltyOwner
      + '\n\nToken Metadata\n' + tokenURI
    );

    /**
     * 3. Verify the signature is valid and identify the owner/token
     */
    const broadcastIdentifier = await blockchain.verifyMessageSignatureAndOwner(
      authorizedAddress,
      authorizedTokenID,
      networkID,
      message,
      messageSigner,
      messageSignature
    );

    /**
     * 4. Generate the token ID, mirroring how it works in the smart contract
     */
    const tweetHash = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        [ "address", "string" ],
        [ messageSigner, messageTokenURI ]
      )
    );
    const tokenID = ethers.BigNumber.from(
      '0x' + tweetHash.slice(-16)
    ).toString();

    /**
     * 5. Take a screenshot of the tweet text
     */
    const tokenFrame = `https://embed-renderer.s3.us-west-2.amazonaws.com/721.html?${encodeURIComponent(tweetMessage)}`;
    const imageCapture = await capturePost(tokenFrame, 'arraybuffer');

    /**
     * 6. Grab the twitter credentials and tweet
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
    const mediaID = await twitter.v1.uploadMedia(imageCapture.data, { type: 'png' });
    const tweet = await twitter.v2.tweet({
      text: `${broadcastIdentifier}:\n\nID ${tokenID}`,
      media: {
        media_ids: [ mediaID ]
      }
    });

    /**
     * 7. Save tweet_token to database
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
        tokenID,
        tokenURI,
        tweetMessage,
        royaltyRate,
        messageRoyaltyOwner,
        messageSigner,
        messageSignature
      ]
    );

    jsonResponse(res, null, tweet.data.id);

    try {
      /**
       * 8. Submit transaction to the blockchain
       */
      const txnID = await blockchain.mint(
        process.env.BICONOMY_API_KEY,
        messageMemo,
        messageRoyaltyRateInteger,
        messageRoyaltyRateDecimal,
        messageRoyaltyOwner,
        messageTokenURI,
        messageSignature
      );
      await pool.query(
        `
        UPDATE tweet_token
        SET token_txid = ?
        WHERE tweet_id = ?
        `,
        [ txnID, tweet.data.id]
      );
    }
    catch (e) {
      console.log('Error Minting: ' + e.message);
    }

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
