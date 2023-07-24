import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
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

const addMetadataToMint = async mint => {
  let image = null;
  let externalURL = null;
  const dataUrl = parseDataUrl(mint.token_uri);
  if (dataUrl) {
    const result = JSON.parse(dataUrl.toBuffer().toString());
    image = dataUrl.image;
    externalURL = dataUrl.external_url;
  } else {
    const result = await axios.get(
      'https://fqk5crurzsicvoqpw67ghzmpda0xjyng.lambda-url.us-west-2.on.aws', {
        params: {
          url: normalizeURL(mint.token_uri)
        }
      }
    );
    image = result.data.image;
    externalURL = result.data.external_url;
  }
  if (image) {
    image = normalizeURL(image);
  }
  return Object.assign({}, mint, {
    image,
    externalURL
  });
};

const chains = {
  1: 'ethereum',
  137: 'polygon',
  7777777: 'zora',
};

function Collection(props) {
  const { chain, contractAddress } = props.match.params;
  const [mints, setMints] = useState([]);
  const [stats, setStats] = useState([]);
  const [collections, setCollections] = useState([]);
  const dims = '200px';
  useEffect(() => {
    data.getTokens({
      chain,
      contractAddress,
      limit: 3,
      offset: 0,
    }).then(async r => {
      const mintsWithMetadata = await Promise.all(r.mints.map(addMetadataToMint));
      setMints(mintsWithMetadata);
    });
    data.getOverlap({
      chain,
      contractAddress,
    }).then(async r => {
      setStats(r.stats);
      setCollections(r.collections);
    });
  }, [chain, contractAddress]);

  useEffect(() => {
    setStats([]);
    setMints([]);
  }, [contractAddress]);

  const collectionMap = {};
  collections.forEach(c => {
    collectionMap[c.contract_address.toLowerCase()] = c;
  });

  const collectionTitle = collectionMap[contractAddress.toLowerCase()] ? collectionMap[contractAddress.toLowerCase()].name : '';
  console.log(stats, collections);
  return (
    <div>
      <div style={{ padding: '2em 1em', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '1em' }}>
          <Link className='nav-link' to={window.location.pathname.split('/').slice(0, -1).join('/')}>⇦</Link>&nbsp;&nbsp;{collectionTitle}
        </div>
      </div>
      {
        stats.length > 0 &&
        <div>
          <div style={{ padding: '0em 1em', maxWidth: '500px', margin: '0 auto' }}>
            <div className='section-header'>Recent mints from this collection</div>
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
          </div>
          <div style={{ padding: '0em 1em', maxWidth: '500px', margin: '0 auto' }}>
            <div className='section-header'>Other recent mints from these collectors</div>
          </div>
          <div style={{ padding: '0 1em', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ padding: '.5em 1.5em' }}>
              <ol style={{ paddingInlineStart: '1em' }}>
                {
                  stats.map(stats => {
                    const collection = collectionMap[stats.contract_address] || {};
                    return (
                      <li key={stats.contract_address} style={{ marginBottom: '.25em' }}>
                        <Link className='collection-link' to={`/${chains[collection.chain_id]}/${collection.contract_address}`}>
                          {collection.name || stats.contract_address}
                        </Link>
                        <div style={{ color: 'gray', fontSize: '.75em' }}>
                          <span>{stats.num_collectors} collectors</span>
                        </div>
                      </li>
                    )
                  })
                }
              </ol>
            </div>
          </div>
        </div>
      }
      <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '2em' }}>
      </div>
    </div>
  );
}

export default Collection;
