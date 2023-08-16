import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import * as data from './data';

function Spenders(props) {
  const [spenders, setSpenders] = useState([]);
  const [range, setRange] = useState('day');
  const [hasMore, setHasMore] = useState(false);
  const [ens, setENS] = useState({});
  const limit = 30;
  useEffect(() => {
    data.getSpenders({
      limit,
      offset: 0,
      range,
    }).then(r => {
      setHasMore(r.length > 0);
      setSpenders(r);
      console.log(r.map(s => s.recipient).join(','));
      data.getENS({ addresses: r.map(s => s.recipient).join(',') }).then(r => setENS(Object.assign({}, ens, r)));
    });
  }, [range]);

  const loadMore = () => {
    data.getFeed({
      limit,
      offset: spenders.length,
      range,
    }).then(r => {
      setHasMore(r.length > 0);
      setSpenders(spenders.concat(r));
      data.getENS({ addresses: r.map(s => s.recipient).join(',') }).then(r => setENS(Object.assign({}, ens, r)));
    });
  };

  const changeRange = range => {
    setHasMore(false);
    setSpenders([]);
    setRange(range);
  }

  return (
    <div>
      <div style={{ padding: '2em 1em', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '1em' }}>
          <img
            src='data:image/png;base64,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'
            style={{
              width: '24px',
              height: '24px',
              marginRight: '.75em',
              marginBottom: '-.1em',
            }}
          />
          Top Minters
        </div>
      </div>
      <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '2em' }}>
        <div className='flex' style={{ alignItems: 'center' }}>
          <div className='flex-grow'></div>
          <div className='flex-shrink' style={{ paddingRight: '.25em' }}>
            <select onChange={(e) => changeRange(e.target.value)}>
              <option value='hour'>Hour</option>
              <option selected value='day'>Day</option>
            </select>
          </div>
        </div>
        <div style={{ padding: '.5em 1.5em' }}>
          <ol style={{ paddingInlineStart: '1em' }}>
            {
              spenders.map(spender => {
                return (
                  <li key={spender.recipient} style={{ marginBottom: '.25em' }}>
                    <Link className='collection-link' to={`/caravan/${spender.recipient}`}>
                      {ens[spender.recipient] || spender.recipient}
                    </Link>
                    <div style={{ color: 'gray', fontSize: '.75em' }}>
                      <span>${spender.spent} spent</span>
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

export default Spenders;
