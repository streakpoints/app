import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import * as data from './data';
import PageHeader from './PageHeader';

function Setup() {

  const [userID, setUserID] = useState(null);
  const [userName, setUserName] = useState(null);
  const [mode, setMode] = useState('address');
  const [tokenContract, setTokenContract] = useState('');
  const [allowAll, setAllowAll] = useState(true);
  const [allowList, setAllowList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    data.getUser().then((result) => {
      if (!result) {
        return;
      }
      setUserID(result.id);
      setUserName(result.name);
      data.getRules({ twitterAccountID: result.id }).then((results) => {
        if (results.length === 0) {
          setAllowAll(true);
        }
        else if (results.filter(r => r.token_id).length > 0) {
          const tokenIDs = [];
          let tokenContract = '';
          results.forEach(r => {
            tokenContract = r.eth_address;
            if (r.token_id && r.token_id !== '*') {
              tokenIDs.push(r.token_id);
            }
          });
          setTokenContract(tokenContract);
          setAllowList(tokenIDs);
          if (tokenIDs.length > 0) {
            setAllowAll(false);
          }
        }
        else if (results.length > 0) {
          setAllowList(results.map(r => r.eth_address));
          setMode('address');
        }
      });
    });
  }, [userID]);

  const save = async () => {
    setSaving(true);
    if (mode === 'collection') {
      if (!tokenContract || tokenContract.length === 0) {
        window.alert('Invalid contract');
        setSaving(false);
        return;
      }
      await data.save({
        allowAll,
        allowList: allowList.join(','),
        authorizedAddress: tokenContract
      });
    }
    else if (mode === 'address') {
      try {
        allowList.map(a => ethers.utils.getAddress(a));
      }
      catch (e) {
        setSaving(false);
        window.alert('Invalid address');
        return;
      }
      await data.save({
        allowList: allowList.length > 0 ? allowList.join(',') : undefined
      });
    }
    setSaving(false);
    setSaved(true);
  }

  let error = null;
  if (tokenContract.length > 0) {
    try {
      ethers.utils.getAddress(tokenContract.toLowerCase());
    }
    catch (e) {
      error = true;
    }
  }

  return (
    <div>
      <PageHeader handle='' />
      <h2 style={{ textAlign: 'center' }}>Manage your bridge</h2>
      <h2>1. Link your account</h2>
      <p>Enable API access to your account.</p>
      <div>
        {
          userID ? (
            <div>Logged in as <a href={`/${userName}`}>@{userName}</a> 🔒 <a href='/' onClick={() => data.logout()}>Logout</a></div>
          ) : (
            <button onClick={data.login}>Login with Twitter</button>
          )
        }
      </div>
      <br />
      <h2>2. Grant access</h2>
      <p>Customize who is allowed to tweet.</p>
      <div className='label'>Grant access to either:</div>
      <label style={{ cursor: 'pointer', userSelect: 'none' }}>
        <input
          type='radio'
          value='Other'
          checked={mode === 'address'}
          onChange={() => {
            setAllowList([]);
            setMode('address');
          }}
        />
        Addresses
      </label>
      <br />
      <label style={{ cursor: 'pointer', userSelect: 'none' }}>
        <input
          type='radio'
          value='Other'
          checked={mode === 'collection'}
          onChange={() => {
            setAllowList([]);
            setAllowAll(true);
            setMode('collection');
          }}
        />
        NFT Collection
      </label>
      <div>
        {
          mode === 'collection' &&
          <div>
            <div className='label'>NFT Contract</div>
            <input
              type='text'
              placeholder='0x...'
              value={tokenContract}
              onChange={e => setTokenContract(e.target.value)}
              style={{ width: '100%' }}
            />
            {
              error &&
              <div style={{ color: 'red', fontSize: '.8em', fontWeight: 'bold' }}>
                Invalid address
              </div>
            }
            <div className='label'>Authorized tokens</div>
            <label>Allow all in collection: </label>
            <input
              type='checkbox'
              id='allow-all'
              onChange={() => {
                if (allowAll) {
                  setAllowList(['']);
                  setAllowAll(false);
                }
                else {
                  setAllowList([]);
                  setAllowAll(true);
                }
              }}
              checked={allowAll}
            />
            {
              !allowAll &&
              <div className='label'>Specify tokens (max 50):</div>
            }
            {
              allowList.map((t, i) => (
                <div key={`token-id-${i}`} style={{ display: 'flex', marginTop: '.5em' }}>
                  <div>
                    <input
                      placeholder='Token ID'
                      type='text'
                      value={t}
                      onChange={(e) => {
                        const cloneList = allowList.slice(0);
                        cloneList[i] = e.target.value;
                        setAllowList(cloneList);
                      }}
                    />
                  </div>
                  {
                    i !== 0 &&
                    <div
                      style={{ padding: '1em', cursor: 'pointer', lineHeight: '1em' }}
                      onClick={() => {
                        const cloneList = allowList.slice(0);
                        cloneList.splice(i, 1);
                        setAllowList(cloneList);
                      }}
                    >
                      ❌
                    </div>
                  }
                </div>
              ))
            }
            {
              !allowAll && allowList.length < 50 &&
              <button
                onClick={() => setAllowList(allowList.slice(0).concat(['']))}
                style={{
                  marginTop: '1em',
                  color: '#000',
                  backgroundColor: '#CCC'
                }}
              >
                Add token
              </button>
            }
          </div>
        }
        {
          mode === 'address' &&
          <div>
            <div className='label'>Specify addresses (max 50):</div>
            {
              allowList.map((t, i) => (
                <div key={`addr-id-${i}`} style={{ display: 'flex', marginTop: '.5em' }}>
                  <div>
                    <input
                      placeholder='0xabc123...'
                      type='text'
                      value={t}
                      style={{ width: '100%' }}
                      onChange={(e) => {
                        const cloneList = allowList.slice(0);
                        cloneList[i] = e.target.value;
                        setAllowList(cloneList);
                      }}
                    />
                  </div>
                  <div
                    style={{ padding: '1em', cursor: 'pointer', lineHeight: '1em' }}
                    onClick={() => {
                      const cloneList = allowList.slice(0);
                      cloneList.splice(i, 1);
                      setAllowList(cloneList);
                    }}
                  >
                    ❌
                  </div>
                </div>
              ))
            }
            {
              allowList.length < 50 &&
              <button
                onClick={() => setAllowList(allowList.slice(0).concat(['']))}
                style={{
                  marginTop: '1em',
                  color: '#000',
                  backgroundColor: '#CCC'
                }}
              >
                Add address
              </button>
            }
          </div>
        }
      </div>
      <br />
      <h2>3. Confirm</h2>
      {
        saved ? (
          <p>Saved. <a href={`/${userName}`}>Tweet here</a>.</p>
        ) : (
          <p>You can change or update this anytime.</p>
        )
      }
      <div style={{ textAlign: 'left', marginTop: '1em' }}>
        <button
          disabled={saving || error || !userID}
          onClick={save}
        >
          { saving ? 'Saving...' : 'Save' }
        </button>
      </div>
      <br />
      <br />
    </div>
  );
}

export default Setup;
