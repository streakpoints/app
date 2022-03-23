import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import * as data from './data';

function Tweet(props) {
  const handle = props.match.params.handle;

  const [address, setAddress] = useState('');
  const [tweetMessage, setTweetMessage] = useState('');
  const [tokenID, setTokenID] = useState(null);
  const [tweetID, setTweetID] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [assets, setAssets] = useState([]);
  const [reviewing, setReviewing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [userID, setUserID] = useState(null);
  const [progress, setProgress] = useState(null);
  
  useEffect(() => {
    data.searchUser({ twitterAccountHandle: handle }).then((result) => {
      if (result.length === 0) {
        setNotFound(true);
      }
      else {
        setUserID(result[0].id);
        data.getRules({ twitterAccountID: result[0].id }).then((results) => {
          let tokenContract = null;
          results.forEach(r => {
            if (r.token_id) {
              tokenContract = r.eth_address;
            }
          });
          setTokenContract(tokenContract);
        });
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

      const tokenURI = await data.archive({
        tokenID,
        networkID,
        authorizedAddress: tokenContract ? tokenContract : signerAddress,
        twitterAccountID: userID,
        tweetMessage
      });

      setProgress('Signing...');

      const royaltyRate = '10.00';
      const royaltyOwner = signerAddress;
      const signature = await signer.signMessage(
        tweetMessage
        + '\n\n-------'
        + '\n\nRoyalty Rate\n' + royaltyRate + '%'
        + '\n\nRoyalty Owner\n' + royaltyOwner
        + '\n\nToken Metadata\n' + tokenURI
      );

      console.log(
        tweetMessage
        + '\n\n-------'
        + '\n\nRoyalty Rate\n' + royaltyRate + '%'
        + '\n\nRoyalty Owner\n' + royaltyOwner
        + '\n\nToken Metadata\n' + tokenURI
      );
      console.log(signature);

      setProgress('Tweeting...');

      const tweetID = await data.tweet({
        twitterAccountID: userID,
        authorizedAddress: tokenContract ? tokenContract : signerAddress,
        authorizedTokenID: tokenID,
        networkID,
        tokenURI,
        royaltyRate,
        royaltyOwner,
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

  if (notFound) {
    return (
      <div>
        <h2>
          <a href='/'>
            Not found. Head home?
          </a>
        </h2>
      </div>
    )
  }

  return (
    <div>
      <h2>
        <a
          target='_blank'
          rel='noreferrer'
          href={`https://twitter.com/${handle}`}
          style={{ textDecoration: 'none' }}
        >
          @{handle} ➫
        </a>
      </h2>
      <textarea
        placeholder="message"
        style={{ width: '100%', height: '30vh', marginBottom: '1em', resize: 'vertical' }}
        value={tweetMessage}
        onChange={e => setTweetMessage(e.target.value)}
      />
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => {
            setReviewing(true);
            setTweetID(false);
          }}
        >
          Tweet
        </button>
      </div>
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
