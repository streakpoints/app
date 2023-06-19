import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import * as data from './data';
function Start(props) {
  const [mints, setMints] = useState([]);
  const [collections, setCollections] = useState([]);
  const [range, setRange] = useState('day');
  const [chain, setChain] = useState(parseInt(props.match.params.chain) || 1);
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

  useEffect(() => {
    setHasMore(false);
    setMints([]);
    setChain(parseInt(props.match.params.chain) || 1);
  }, [props.match.params.chain]);

  const collectionMap = {};
  collections.forEach(c => collectionMap[c.contract_address] = c);
  return (
    <div>
      <div style={{ padding: '2em 1em', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '1em' }}>
          🏄‍♂️&nbsp;&nbsp;Collector Charts
        </div>
      </div>
      <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '2em' }}>
        <div className='flex' style={{ alignItems: 'center' }}>
          <Link className={`flex-shrink ${chain === 1 ? 'filter selected' : 'filter'}`} to='/1'>Ethereum</Link>
          <Link className={`flex-shrink ${chain === 137 ? 'filter selected' : 'filter'}`} to='/137'>Polygon</Link>
          <div className='flex-grow'></div>
          <div className='flex-shrink' style={{ paddingRight: '.25em' }}>
            <select onChange={(e) => changeRange(e.target.value)}>
              <option value='minute'>Minute</option>
              <option value='hour'>Hour</option>
              <option selected value='day'>Day</option>
              <option value='week'>Week</option>
            </select>
          </div>
        </div>
        <div style={{ padding: '.5em 1.5em' }}>
          <ol style={{ paddingInlineStart: '1em' }}>
            {
              mints.map(mint => {
                const collection = collectionMap[mint.contract_address] || {};
                const numComments = collection.num_comments || 0;
                return (
                  <li key={mint.contract_address} style={{ marginBottom: '.25em' }}>
                    <Link className='collection-link' to={`/${collection.chain_id}/${collection.contract_address}`}>
                      {collection.name || mint.contract_address}
                    </Link>
                    <div style={{ color: 'gray', fontSize: '.75em' }}>
                      <span>{mint.total} collectors</span>
                      <span>{numComments > 0 && ` | ${numComments} comment${numComments !== 1 && 's'}`}</span>
                    </div>
                  </li>
                )
              })
            }
          </ol>
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
