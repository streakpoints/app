import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import axios from 'axios';
import parseDataUrl from 'parse-data-url';
import * as data from './data';

const normalizeURL = image => {
  if (image.indexOf('ipfs://') === 0) {
    image = image.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  if (image.indexOf('ar://') === 0) {
    image = image.replace('ar://', 'https://arweave.net/');
  }
  return image;
};

const chains = {
  1: 'ethereum',
  10: 'optimism',
  137: 'polygon',
  8453: 'base',
  7777777: 'zora',
};

const getTokenImage = async mint => {
  let image = null;
  try {
    const dataUrl = parseDataUrl(mint.token_uri);
    if (dataUrl) {
      const result = JSON.parse(dataUrl.toBuffer().toString());
      image = result.image;
    } else if (mint.token_uri) {
      const result = await axios.get(
        'https://fqk5crurzsicvoqpw67ghzmpda0xjyng.lambda-url.us-west-2.on.aws', {
          params: {
            url: normalizeURL(mint.token_uri)
          }
        }
      );
      image = result.data.image;
    }
    if (image) {
      image = normalizeURL(image);
    }
  } catch (e) {
    console.log('Skipping', mint);
  }
  return [mint.contract_address, image];
};


function Start(props) {
  const [mints, setMints] = useState([]);
  const [collections, setCollections] = useState([]);
  const [range, setRange] = useState('day');
  const [chain, setChain] = useState(props.match.params.chain || 'ethereum');
  const [hasMore, setHasMore] = useState(false);
  const [collectionImages, setCollectionImages] = useState({});
  const limit = 10;
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
      Promise.all(r.mints.map(async (m) => {
        try {
          return await getTokenImage(m);
        } catch (e) {
          return [m.contract_address, null];
        }
      })).then(results => {
        const collectionImages = {};
        results.forEach(r => collectionImages[r[0]] = r[1]);
        setCollectionImages(collectionImages);
      })
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
      Promise.all(r.mints.map(async (m) => {
        try {
          return await getTokenImage(m);
        } catch (e) {
          return [m.contract_address, null];
        }
      })).then(results => {
        const images = Object.assign({}, collectionImages);
        results.forEach(r => images[r[0]] = r[1]);
        setCollectionImages(images);
      })
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
    setChain(props.match.params.chain || 'ethereum');
  }, [props.match.params.chain]);

  const collectionMap = {};
  collections.forEach(c => collectionMap[c.contract_address] = c);

  const thumbSize = '80px';

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
          Collection Charts
        </div>
      </div>
      <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '2em' }}>
        <div className='flex' style={{ alignItems: 'center' }}>
          <Link className={`flex-shrink ${chain === 'ethereum' ? 'filter selected' : 'filter'}`} to='/ethereum'>Ethereum</Link>
          <Link className={`flex-shrink ${chain === 'polygon' ? 'filter selected' : 'filter'}`} to='/polygon'>Polygon</Link>
          <Link className={`flex-shrink ${chain === 'zora' ? 'filter selected' : 'filter'}`} to='/zora'>Zora</Link>
          <Link className={`flex-shrink ${chain === 'base' ? 'filter selected' : 'filter'}`} to='/base'>Base</Link>
          <Link className={`flex-shrink ${chain === 'optimism' ? 'filter selected' : 'filter'}`} to='/optimism'>Optimism</Link>
          <div className='flex-grow'>&nbsp;</div>
          <div className='flex-shrink' style={{ paddingRight: '.25em' }}>
            <select onChange={(e) => changeRange(e.target.value)}>
              <option value='hour'>Hour</option>
              <option selected value='day'>Day</option>
            </select>
          </div>
        </div>
        <div style={{ padding: '.5em' }}>
          <ol style={{ paddingInlineStart: '0em', fontSize: '18px' }}>
            {
              mints.map(mint => {
                const collection = collectionMap[mint.contract_address] || {};
                const spentWei = parseInt(mint.spent) > 100000 ? (mint.spent + '000000000') : null;
                const spentEth = spentWei && parseFloat(ethers.utils.formatEther(spentWei)).toFixed('2');
                return (
                  <li key={mint.contract_address} style={{ marginBottom: '1em' }} className='flex'>
                    <div
                      className='flex-shrink'
                      style={{ textAlign: 'center', marginRight: '1em', width: thumbSize, height: thumbSize }}
                    >
                      <img
                        src={collectionImages[mint.contract_address] || 'https://cent-resources-prod.s3.us-west-2.amazonaws.com/Screenshot+2023-08-13+at+11.41.05+PM_1691988070933.png'}
                        style={{ height: thumbSize, maxWidth: thumbSize, borderRadius: '3px' }}
                      />
                    </div>
                    <div className='flex-grow' style={{ marginTop: '.25em' }}>
                      <Link className='collection-link' to={`/${chains[collection.chain_id]}/${collection.contract_address}`}>
                        {collection.name || mint.contract_address}
                      </Link>
                      <div style={{ color: 'gray', fontSize: '.75em' }}>
                        <div>{mint.total} collector{mint.total > 1 ? 's' : ''}</div>
                        <div>{spentWei ? `${spentEth} ${chain === 'polygon' ? 'MATIC' : 'ETH'} spent` : ''}</div>
                      </div>
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
