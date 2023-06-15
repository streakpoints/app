import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';

import * as data from './data';
function Start() {
  const [mints, setMints] = useState([]);
  const [collections, setCollections] = useState([]);
  const [range, setRange] = useState(60 * 24);
  const [chain, setChain] = useState(137);
  const [hasMore, setHasMore] = useState(false);
  const limit = 30;
  useEffect(() => {
    data.getFeed({
      chain,
      limit,
      offset: 0,
      range,
    }).then(r => {
      setHasMore(r.mints.length > 0);
      setMints(r.mints);
      setCollections(r.collections);
    });
  }, [range, chain]);

  const loadMore = () => {
    data.getFeed({
      chain,
      limit,
      offset: mints.length,
      range,
    }).then(r => {
      setHasMore(r.mints.length > 0);
      setMints(mints.concat(r.mints).sort((a, b) => a.total > b.total ? -1 : 1));
      setCollections(collections.concat(r.collections));
    });
  };

  const changeRange = range => {
    setHasMore(false);
    setMints([]);
    setRange(range);
  }

  const changeChain = chain => {
    setHasMore(false);
    setMints([]);
    setChain(chain);
  }

  const collectionMap = {};
  collections.forEach(c => collectionMap[c.contract_address] = c);
  return (
    <div>
      <div style={{ padding: '2em 1em', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '1em' }}>
          🏄‍♂️&nbsp;&nbsp;New Collectibles
        </div>
      </div>
      <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '2em' }}>
        <div className='flex' style={{ alignItems: 'center' }}>
          <div className='flex-shrink' onClick={() => changeChain(1)}>
            <div className={chain === 1 ? 'filter selected' : 'filter'}>Ethereum</div>
          </div>
          <div className='flex-shrink' onClick={() => changeChain(137)}>
            <div className={chain === 137 ? 'filter selected' : 'filter'}>Polygon</div>
          </div>
          <div className='flex-grow'></div>
          <div className='flex-shrink' style={{ paddingRight: '.25em' }}>
            <select onChange={(e) => changeRange(e.target.value)}>
              <option value={1}>Minute</option>
              <option value={60}>Hour</option>
              <option selected value={60 * 24}>Day</option>
              <option value={60 * 24 * 7}>Week</option>
              <option value={60 * 24 * 7}>Month</option>
            </select>
          </div>
        </div>
        <div style={{ padding: '.5em' }}>
          <div className='flex' style={{ fontWeight: 'bold', paddingBottom: '.25em' }}>
            <div className='flex-shrink' style={{ minWidth: '4em' }}>Minted</div>
            <div className='flex-grow'>
              Collection
            </div>
          </div>
          {
            mints.map(mint => (
              <div key={mint.contract_address} className='flex'>
                <div className='flex-shrink' style={{ minWidth: '4em' }}>{mint.total}</div>
                <div className='flex-grow' style={{ overflow: 'hidden' }}>
                  {(collectionMap[mint.contract_address] || {}).name || mint.contract_address}
                </div>
              </div>
            ))
          }
          {
            hasMore &&
            <div style={{ display: 'block', paddingTop: '.25em' }}>
              <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={loadMore}>More</span>
            </div>
          }
        </div>
      </div>
    </div>
  );
}

export default Start;
