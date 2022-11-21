import React, { useState, useEffect } from 'react';

import PageHeader from './PageHeader';
import TweetEmbed from './TweetEmbed';
import * as data from './data';

function Start() {
  const [tweets, setTweets] = useState([]);

  useEffect(() => {
    data.getTweets({})
    .then(tweets => {
      setTweets(tweets);
    })
  }, []);

  return (
    <div>
      <div style={{ padding: '2em', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '1em' }}>
          Tweet from your wallet&nbsp;<i className="fab fa-twitter" style={{ color: 'rgb(29, 161, 242)' }} />
        </div>
        <div style={{ textTransform: 'uppercase', fontWeight: 'bold', color: 'rgb(153, 153, 153)', marginTop: '8px' }}>No password needed</div>
        <div style={{ padding: '1em 0' }}>
          <PageHeader />
        </div>
        {/*<p><a target='_blank' rel='noreferrer' href='https://docs.google.com/document/d/1x0KF0fKu6pSgdcBtqAn5UGuyEWrd2_Kt1UYDfC_2OsA/edit?usp=sharing'>FAQ.</a></p>*/}
        <br />
      </div>
      <div style={{ padding: '0 2em', maxWidth: '500px', margin: '0 auto' }}>
        <h2>Recent Tweets</h2>
      </div>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ padding: '0 .5em' }}>
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
      </div>
    </div>
  );
}

export default Start;
