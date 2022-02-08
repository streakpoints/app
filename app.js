const express = require('express');
const bodyParser = require('body-parser');
const checkOwner = require('./js/check-owner');

const app = express();
const port = 8000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

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

app.get('/', (req, res) => {
  res.render('index.html');
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
    jsonResponse(res, null, { status: 'TRANSMISSION RECEIVED' });
  }
  catch (e) {
    jsonResponse(res, e);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
