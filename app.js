const express = require('express');
const bodyParser = require('body-parser');
const TwitterApi = require('twitter-api-v2').TwitterApi;
const passport = require('passport');
const Strategy = require('passport-twitter').Strategy;
const expressSession = require('express-session');
const textToImage = require('text-to-image');
const Base64 = require('js-base64');

const checkOwner = require('./js/check-owner');

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

app.use(expressSession({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

const twitterKeys = {
  appKey: '7xK8ncAfXjWcr3ouyTJq36HpM',
  appSecret: 'BbvUKoXkE5SBP3jvF1zEslhY6uZMxUU2NwYP03r3KSHeuAFPXK',
  accessToken: null,
  accessSecret: null
};

passport.use(new Strategy({
  consumerKey: twitterKeys.appKey,
  consumerSecret: twitterKeys.appSecret,
  callbackURL: '/auth/twitter/callback',
  proxy: true
}, function (token, tokenSecret, profile, cb) {
  twitterKeys.accessToken = token;
  twitterKeys.accessSecret = tokenSecret;
  return cb(null, {
    id: profile.id,
    token: token,
    secret: tokenSecret
  });
}));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

app.get('/', (req, res) => {
  res.render('index.html', {
    showAuth: !twitterKeys.accessToken
  });
});

app.get('/auth/twitter/init', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/?failure' }), (req, res) => {
  res.redirect('/?success');
});

app.post('/', async (req, res) => {
  const {
    tokenID,
    message,
    signer,
    signature
  } = req.body;
  try {
    await checkOwner(tokenID, message, signer, signature);
    const twitter = new TwitterApi(twitterKeys);


    const imageUri = await textToImage.generate(message, {
      textAlign: 'left',
      verticalAlign: 'center',
      maxWidth: 600,
      customHeight: 300,
      fontWeight: 'bold'
    });

    const mediaID = await twitter.v1.uploadMedia(
      Buffer.from(Base64.toUint8Array(imageUri.replace('data:image/png;base64,', ''))),
      { type: 'png' }
    );

    const tweet = await twitter.v2.tweet({
      text: '',
      media: {
        media_ids: [ mediaID ]
      }
    });

    const reply = await twitter.v2.tweet({
      text: `From Zorb #${tokenID}\n\n${signer}\n\n${signature}`,
      reply: {
        in_reply_to_tweet_id: tweet.data.id
      }
    });

    res.redirect('/?tweetID=' + tweet.data.id);
  }
  catch (e) {
    console.log(e);
    jsonResponse(res, e);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
