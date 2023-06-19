import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

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

const addMetadataToMint = async mint => {
  const result = mint.token_uri.indexOf('data:') === 0 ? (await axios.get(mint.token_uri)) : (await axios.get(
    'https://fqk5crurzsicvoqpw67ghzmpda0xjyng.lambda-url.us-west-2.on.aws', {
      params: {
        url: normalizeURL(mint.token_uri)
      }
    }
  ));
  let image = result.data.image;
  if (image) {
    image = normalizeURL(image);
  }
  let externalURL = result.data.external_url;
  return Object.assign({}, mint, {
    image,
    externalURL
  });
};

function Collection(props) {
  const { chain, contractAddress } = props.match.params;
  const [mints, setMints] = useState([]);
  const [collections, setCollections] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const limit = 9;
  const dims = '200px';
  useEffect(() => {
    data.getTokens({
      chain,
      contractAddress,
      limit,
      offset: 0,
    }).then(async r => {
      setHasMore(r.mints.length > 0);
      setCollections(r.collections);
      const mintsWithMetadata = await Promise.all(r.mints.map(addMetadataToMint));
      setMints(mintsWithMetadata);
    });
  }, [chain, contractAddress]);

  const loadMore = () => {
    data.getTokens({
      chain,
      contractAddress,
      limit,
      offset: mints.length,
    }).then(async r => {
      setHasMore(r.mints.length > 0);
      const mintsWithMetadata = await Promise.all(r.mints.map(addMetadataToMint));
      setMints(mints.concat(mintsWithMetadata));
    });
  };

  const collectionTitle = collections.length > 0 ? collections[0].name : '';

  return (
    <div>
      <div style={{ padding: '2em 1em', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '1em' }}>
          <Link className='nav-link' to={window.location.pathname.split('/').slice(0, -1).join('/')}>⇦</Link>&nbsp;&nbsp;{collectionTitle}
        </div>
      </div>
      {
        mints.length > 0 &&
        <div>
          <div style={{ padding: '2em 1em', maxWidth: '500px', margin: '0 auto' }}>
            <div className='section-header'>Recent Mints</div>
          </div>
          <div style={{ padding: '2em 1em', maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            {
              mints.filter(m => m.image).map(m => (
                <div style={{ display: 'inline-block', verticalAlign: 'top', padding: '.5em', minWidth: dims }}>
                  <img alt='nft' src={m.image} style={{ maxWidth: dims, maxHeight: dims, backgroundColor: '#fafafa' }} />
                  {
                    m.externalURL &&
                    <a
                      href={m.externalURL}
                      target='_blank'
                      rel='noreferrer'
                      className='external-link'
                      style={{ maxWidth: dims }}
                    >
                      {m.externalURL}
                    </a>
                  }
                </div>
              ))
            }
            {
              hasMore &&
              <div style={{ display: 'inline-block', verticalAlign: 'top', padding: '.5em' }}>
                <div
                  className='flex'
                  onClick={loadMore}
                  style={{
                    alignItems: 'center',
                    width: dims,
                    height: dims,
                    justifyContent: 'center',
                    fontSize: '3em',
                    userSelect: 'none',
                    cursor: 'pointer',
                    backgroundColor: '#fafafa'
                  }}
                >
                  ➕
                </div>
              </div>
            }
          </div>
        </div>
      }
      <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '2em' }}>
      </div>
    </div>
  );
}

export default Collection;
