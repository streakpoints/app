import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import * as data from './data';
import PageHeader from './PageHeader';

function Setup() {

  const [userID, setUserID] = useState(null);
  const [userName, setUserName] = useState(null);
  const [mode, setMode] = useState('address');
  const [tokenContract, setTokenContract] = useState('');
  const [allowAll, setAllowAll] = useState(true);
  const [accessControlList, setAccessControlList] = useState([]);
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
          setMode('collection');
          const tokenIDs = [];
          let tokenContract = '';
          results.forEach(r => {
            tokenContract = r.eth_address;
            if (r.token_id && r.token_id !== '*') {
              tokenIDs.push(r.token_id);
            }
          });
          setTokenContract(tokenContract);
          setAccessControlList(tokenIDs);
          if (tokenIDs.length > 0) {
            setAllowAll(false);
          }
        }
        else if (results.length > 0) {
          setMode('address');
          setAccessControlList(results.map(r => r.eth_address));
        }
      });
    });
  }, [userID]);

  const save = async () => {
    setSaving(true);
    const ACL = accessControlList.length > 0 ? accessControlList.join(',') : undefined;
    if (mode === 'collection') {
      if (!tokenContract || tokenContract.length === 0) {
        window.alert('Invalid contract');
        setSaving(false);
        return;
      }
      if (allowAll) {
        await data.save({
          allowAll: true,
          accessControlList: ACL,
          authorizedAddress: tokenContract
        });
      }
      else {
        await data.save({
          accessControlList: ACL,
          authorizedAddress: tokenContract
        });
      }
    }
    else if (mode === 'address') {
      try {
        accessControlList.map(a => ethers.utils.getAddress(a));
      }
      catch (e) {
        setSaving(false);
        window.alert('Invalid address');
        return;
      }
      await data.save({
        accessControlList: ACL
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
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <PageHeader fixed />
      <h2 style={{ margin: '2em .5em' }}>Setup your account</h2>
      <div style={{ padding: '0 .5em'}}>
        <div style={{ textTransform: 'uppercase', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>1. Link your @handle</div>
        <div>
          {
            userID ? (
              <div>Logged in as <Link to={`/${userName}`}>@{userName}</Link>. To switch accounts, <a href='/' onClick={() => data.logout()}>logout</a>.</div>
            ) : (
              <button onClick={data.login}>Login with Twitter</button>
            )
          }
        </div>
        <br />
        <div style={{ textTransform: 'uppercase', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>2. Grant web3 access</div>
        <div style={{ margin: '0 .5em' }}>
          <div className='label'>Grant access to:</div>
          <label style={{ cursor: 'pointer', userSelect: 'none' }}>
            <input
              type='radio'
              value='Other'
              checked={mode === 'address'}
              onChange={() => {
                setAccessControlList([]);
                setMode('address');
              }}
            />
            ETH Addresses
          </label>
          <br />
          <label style={{ cursor: 'pointer', userSelect: 'none' }}>
            <input
              type='radio'
              value='Other'
              checked={mode === 'collection'}
              onChange={() => {
                setAccessControlList([]);
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
                      setAccessControlList([]);
                      setAllowAll(false);
                    }
                    else {
                      setAccessControlList([]);
                      setAllowAll(true);
                    }
                  }}
                  checked={allowAll}
                />
                {
                  allowAll ? (
                    <div className='label'>Block list:</div>
                  ) : (
                    <div className='label'>Allow list:</div>
                  )
                }
                {
                  accessControlList.map((t, i) => (
                    <div key={`token-id-${i}`} style={{ display: 'flex', marginTop: '.5em' }}>
                      <div>
                        <input
                          placeholder='Token ID'
                          type='text'
                          value={t}
                          onChange={(e) => {
                            const cloneList = accessControlList.slice(0);
                            cloneList[i] = e.target.value;
                            setAccessControlList(cloneList);
                          }}
                        />
                      </div>
                      <div
                        style={{ padding: '1em', cursor: 'pointer', lineHeight: '1em' }}
                        onClick={() => {
                          const cloneList = accessControlList.slice(0);
                          cloneList.splice(i, 1);
                          setAccessControlList(cloneList);
                        }}
                      >
                        ➖
                      </div>
                    </div>
                  ))
                }
                {
                  accessControlList.length < 1000 &&
                  <button
                    onClick={() => setAccessControlList(accessControlList.slice(0).concat(['']))}
                    style={{
                      marginTop: '1em',
                      color: '#000',
                      backgroundColor: '#CCC'
                    }}
                  >
                  ➕
                  </button>
                }
              </div>
            }
            {
              mode === 'address' &&
              <div>
                <div className='label'>Specify addresses (max 1000):</div>
                {
                  accessControlList.map((t, i) => (
                    <div key={`addr-id-${i}`} style={{ display: 'flex', marginTop: '.5em' }}>
                      <div>
                        <input
                          placeholder='0xabc123...'
                          type='text'
                          value={t}
                          style={{ width: '100%' }}
                          onChange={(e) => {
                            const cloneList = accessControlList.slice(0);
                            cloneList[i] = e.target.value;
                            setAccessControlList(cloneList);
                          }}
                        />
                      </div>
                      <div
                        style={{ padding: '1em', cursor: 'pointer', lineHeight: '1em' }}
                        onClick={() => {
                          const cloneList = accessControlList.slice(0);
                          cloneList.splice(i, 1);
                          setAccessControlList(cloneList);
                        }}
                      >
                        ➖
                      </div>
                    </div>
                  ))
                }
                {
                  accessControlList.length < 1000 &&
                  <button
                    onClick={() => setAccessControlList(accessControlList.slice(0).concat(['']))}
                    style={{
                      marginTop: '1em',
                      color: '#000',
                      backgroundColor: '#CCC'
                    }}
                  >
                    ➕
                  </button>
                }
              </div>
            }
          </div>
          <br />
        </div>
        <div style={{ textTransform: 'uppercase', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>3. Save Changes</div>
        {
          saved ? (
            <p>Saved. <a href={`/${userName}`}>Tweet here</a>.</p>
          ) : (
            <p>You can change or update this at any time.</p>
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
      </div>
      <br />
      <br />
    </div>
  );
}

export default Setup;
