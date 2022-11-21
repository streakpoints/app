import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import styled from 'styled-components';
import PageHeader from './PageHeader';
import TweetEmbed from './TweetEmbed';
import * as data from './data';

function Tweet(props) {
  const handle = props.match.params.handle;

  const [address, setAddress] = useState('');
  const [tweetMessage, setTweetMessage] = useState('');
  const [tokenID, setTokenID] = useState(null);
  const [tweetID, setTweetID] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [tokenContract, setTokenContract] = useState(null);
  const [assets, setAssets] = useState([]);
  const [reviewing, setReviewing] = useState(false);
  const [userID, setUserID] = useState(null);
  const [progress, setProgress] = useState(null);
  const [rules, setRules] = useState([]);
  
  useEffect(() => {
    data.searchUser({ twitterAccountHandle: handle }).then((result) => {
      if (result.length === 0) {
        setTokenContract(null);
        setTweets([]);
        setAssets([]);
        setTokenID(null);
        setAddress('');
        setRules([]);
      }
      else {
        setUserID(result[0].id);
        data.getRules({ twitterAccountID: result[0].id }).then((results) => {
          setRules(results);
          let tokenContract = null;
          results.forEach(r => {
            if (r.token_id) {
              tokenContract = r.eth_address;
            }
          });
          setTokenContract(tokenContract);
        });
        data.getTweets({ twitterAccountID: result[0].id })
        .then(tweets => {
          setTweets(tweets);
        })
      }
    });
  }, [handle]);

  const connectWallet = async () => {
    await window.ethereum.enable();
    const eth = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await eth.getSigner();
    const signerAddress = await signer.getAddress();
    setAddress(signerAddress);
    if (tokenContract) {
      const assets = await data.getAssetsOpensea(signerAddress, tokenContract);
      setAssets(assets);
    }
  };

  const tweet = async () => {
    try {
      setProgress('Uploading...');

      const networkID = 1;

      const eth = new ethers.providers.Web3Provider(window.ethereum);
      const signer = await eth.getSigner();
      const signerAddress = await signer.getAddress();

      setProgress('Signing...');

      const signature = await signer.signMessage(tweetMessage);

      setProgress('Tweeting...');

      const tweetID = await data.tweet({
        twitterAccountID: userID,
        authorizedAddress: tokenContract ? tokenContract : signerAddress,
        authorizedTokenID: tokenID,
        networkID,
        tweetMessage,
        messageSigner: signerAddress,
        messageSignature: signature
      });
      setProgress(null);
      setTweetID(tweetID);
    }
    catch (e) {
      setProgress(e.message);
      setTimeout(() => setProgress(null), 3000);
    }
  };

  const addressMap = {};
  rules.forEach(r => addressMap[r.eth_address] = true);
  const addresses = Object.keys(addressMap);
  const allowedTokenIDs = rules.filter(r => r.token_id && r.is_allowed).map(r => r.token_id);
  const blockedTokenIDs = rules.filter(r => r.token_id && !r.is_allowed).map(r => r.token_id);

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ padding: '0 .5em' }}>
        <PageHeader fixed />
        <textarea
          maxlength="200"
          placeholder="message"
          style={{ width: '100%', height: '30vh', marginBottom: '1em', resize: 'vertical' }}
          value={tweetMessage}
          onChange={e => setTweetMessage(e.target.value)}
        />
        <div style={{ textAlign: 'center' }}>
          <button
            disabled={addresses.length === 0}
            onClick={() => {
              setReviewing(true);
              setTweetID(false);
            }}
          >
            Tweet
          </button>
        </div>
        <h2>Who has access?</h2>
        <div>
          {
            addresses.length > 0 ? (
              <div style={{ padding: '0 .5em', overflowX: 'scroll' }}>
                {
                  addresses.map(a => (
                    <div style={{ paddingBottom: '1em' }}>
                      <div><b>Address:</b> <a href={`https://etherscan.io/address/${a}`} target='_blank' rel='noreferrer'>{a}</a></div>
                    </div>
                  ))
                }
                {
                  allowedTokenIDs.length > 0 &&
                  <div style={{ paddingBottom: '1em' }}>
                    <div><b>Allowed tokens:</b> { allowedTokenIDs.join(', ')}</div>
                  </div>
                }
                {
                  blockedTokenIDs.length > 0 &&
                  <div style={{ paddingBottom: '1em' }}>
                    <div><b>Blocked tokens:</b> { blockedTokenIDs.join(', ')}</div>
                  </div>
                }
              </div>
            ) : (
              <div>
                This account isn&apos;t set up yet. <Link to='/i'>Set it up now</Link>
              </div>
            )
          }
        </div>
        {
          addresses.length > 0 &&
          <div>
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
        }
        {
          reviewing &&
          <ClickCapturer onClick={() => setReviewing(false)}>
            <ModalView onClick={e => e.stopPropagation()}>
              <div
                onClick={() => setReviewing(false)}
                style={{
                  padding: '1em',
                  cursor: 'pointer',
                  position: 'absolute',
                  top: 0,
                  right: 0
                }}
              >
                ✖
              </div>

              <div style={{ textAlign: 'center' }}>
                <h2>Sign Message</h2>
                {
                  !tweetID &&
                  <div>
                    {
                      tokenContract && address &&
                      <div>
                        {
                          assets.length > 0 ? (
                            <select
                              style={{ width: '100%' }}
                              onChange={e => setTokenID(e.target.value)}
                              value={tokenID || -1}
                            >
                              <option value={-1}>-------</option>
                              {
                                assets.map((a, i) => (
                                  <option key={`token-id-${a.token_id}`} value={a.token_id}>#{a.token_id}</option>
                                ))
                              }
                            </select>
                          ) : (
                            <input
                              placeholder='Token ID'
                              type='text'
                              value={tokenID || ''}
                              onChange={e => setTokenID(e.target.value)}
                            />
                          )
                        }
                      </div>
                    }
                    {
                      address ? (
                        <div style={{ textAlign: 'center', marginTop: '1em', paddingBottom: '3em' }}>
                          <button disabled={progress} onClick={tweet}>
                            { progress|| 'Sign and Tweet' }
                          </button>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', paddingBottom: '3em' }}>
                          <button onClick={connectWallet}>🆔 Connect Wallet</button>
                        </div>
                      )
                    }
                  </div>
                }
                {
                  tweetID &&
                  <div style={{ paddingBottom: '3em' }}>Success. <a href={`https://twitter.com/user/status/${tweetID}`}>View tweet</a></div>
                }
              </div>
            </ModalView>
          </ClickCapturer>
        }
      </div>
    </div>
  );
}

const ClickCapturer = styled.div`
  background-color: #99999999;
  position: fixed;
  z-index: 0;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
`;


const ModalView = styled.div`
  box-sizing: border-box;
  position: relative;
  width: 300px;
  margin: 0 auto;
  padding: 1em;
  background-color: white;
  border-radius: 12px;
`;

export default Tweet;
