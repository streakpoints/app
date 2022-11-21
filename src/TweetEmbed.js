import React, { useCallback } from 'react';

function TweetEmbed(props) {
  const tweetContainer = useCallback(async (node) => {
    if (node !== null) {
      window.twttr.widgets.createTweet(
        props.tweetID,
        node,
        { theme: 'light', conversation: 'none' }
      ).catch(console.log);
    }
  }, [ props.tweetID ]);

  return (
    <div style={{ marginBottom: '3em' }}>
      <div ref={tweetContainer}>
        {props.memo}
      </div>
    </div>
  );
}
export default TweetEmbed;
