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
      <a
        rel='noreferrer'
        target='_blank'
        style={{ textDecoration: 'none' }}
        href={`/${props.handle}`}
      >
        @{props.handle}
      </a>
      &nbsp;&middot;&nbsp;
      <a
        rel='noreferrer'
        target='_blank'
        style={{ textDecoration: 'none' }}
        href={`https://opensea.io/assets/matic/0x6Ea6c2B23c20db0F6024D39C5F61C56c4AB4E5F1/${props.tokenID}`}
      >
        NFT
      </a>
    </div>
  );
}
export default TweetEmbed;
