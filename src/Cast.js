import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';

import * as data from './data';

function Start(props) {
  const [cast, setCast] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const [user, hashPrefix] = cast.split('/').slice(-2);
  const recast = async () => {
    setError(null);
    try {
      const result = await data.checkCast({
        user,
        hashPrefix
      });

      if (window.ethereum) {
        await window.ethereum.enable();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        if (network.chainId != 1) {
          throw new Error('Switch to ETH mainnet');
        }
        const signer = provider.getSigner();
        const address = signer.getAddress();

        // Creating a transaction param
        const tx = {
            from: address,
            to: '0x0000000000000000000000000000000000000000',
            value: ethers.utils.parseEther('0.001'),
        };
        const txn = await signer.sendTransaction(tx);
        await data.recast({
          user,
          hashPrefix,
          txid: txn.hash
        });
        setSuccess(txn.hash);
      } else {
        throw new Error('Metamask not found');
      }
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div style={{ padding: '2em 1em', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '1em' }}>
          <Link to='/'>
            <img
              src='data:image/png;base64,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'
              style={{
                width: '24px',
                height: '24px',
                marginRight: '.75em',
                marginBottom: '-.1em',
              }}
            />
          </Link>
          Ethcaster
        </div>
        <h3>Farcaster is a high-signal network. It's early along, yet getting exposure can still feel daunting.</h3>
        <h3>Ethcaster lets you burn ETH to recast your message via the @ethcaster account.</h3>
        <h3>Current burn requirement to recast: 0.001 ETH.</h3>
      </div>
      <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '2em' }}>
        <div>
        </div>
        <div style={{ padding: '.5em 0' }}>
          <input
            style={{ width: '100%' }}
            type="text"
            placeholder="warpcast.com cast url"
            value={cast} onChange={(e) => setCast(e.target.value)}
          ></input>
          <br />
          <br />
          {
            success ? (
              <div>
                Success! Recast should happen within 1 minute of <a href={`https://etherscan.io/tx/${success}`}>transaction</a> confirming.
              </div>
            ) : (
              <button onClick={recast}>Recast</button>
            )
          }
          <br />
          <br />
          <div style={{ fontStyle: 'italic' }}>
            Note: do not resubmit this transaction.
          </div>
          <br />
          <br />
          <div style={{ color: 'red' }}>
            {error}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Start;
