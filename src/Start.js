import React, { useState, useEffect } from 'react';
import PageHeader from './PageHeader';
import TweetEmbed from './TweetEmbed';
import * as data from './data';

function Start() {
  const [tweets, setTweets] = useState([]);

  useEffect(() => {
    data.getTweets({})
    .then(tweets => {
      console.log(tweets);
      setTweets(tweets);
    })
  }, []);

  return (
    <div>
      <PageHeader handle='' />
      <h2 style={{ textAlign: 'center' }}>web3 🤝 tweets</h2>
      <p>Tweet directly from your web3 wallet, no password necessary. Every tweet is also minted to you as an NFT.</p>
      <p>Grant tweet privileges to a single address, a group of addresses, or an NFT collection. </p>
      <p>For more information, check out our <a target='_blank' rel='noreferrer' href='https://docs.google.com/document/d/1x0KF0fKu6pSgdcBtqAn5UGuyEWrd2_Kt1UYDfC_2OsA/edit?usp=sharing'>FAQ.</a> Tap the gear to get set up!</p>
      <br />
      <h2>Recent Tweets</h2>
      {
        tweets.map(t => (
          <TweetEmbed
            memo={null}
            handle={t.handle}
            tweetID={t.tweet_id}
            tokenID={t.token_id}
            key={t.tweet_id}
          />
        ))
      }
    </div>
  );
}

export default Start;
