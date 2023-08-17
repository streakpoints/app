import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Buffer } from 'buffer';
import parseDataUrl from 'parse-data-url';
import { ethers } from 'ethers';
import * as data from './data';

window.Buffer = Buffer;

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
    image = result.image;
    externalURL = result.external_url;
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
  10: 'optimism',
  137: 'polygon',
  8453: 'base',
  7777777: 'zora',
};

function Collection(props) {
  const { chain, contractAddress } = props.match.params;
  const [collectors, setCollectors] = useState([]);
  const [collection, setCollection] = useState({});
  const [mints, setMints] = useState([]);
  const [ens, setENS] = useState({});
  const dims = '200px';
  useEffect(() => {
    data.getCollection({
      contractAddress
    }).then(r => {
      if (r.length > 0) {
        setCollection(r[0]);
      }
    });
    data.getTokens({
      chain,
      contractAddress,
      limit: 3,
      offset: 0,
    }).then(async r => {
      const mintsWithMetadata = await Promise.all(r.mints.map(addMetadataToMint));
      setMints(mintsWithMetadata);
    });
    data.getTopCollectors({
      contractAddress,
    }).then(async r => {
      setCollectors(r);
      if (r.length > 0) {
        data.getENS({
          addresses: r.map(u => u.recipient).join(',')
        }).then(e => {
          setENS(e);
        });
      }
    });
  }, []);
  return (
    <div>
      <div style={{ padding: '2em 1em', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '1em' }}>
          {
            props.onClickBack ? (
              <span style={{ cursor: 'pointer' }} className='nav-link' onClick={props.onClickBack}>⇦</span>
            ) : (
              <Link className='nav-link' to={window.location.pathname.split('/').slice(0, -1).join('/')}>⇦</Link>
            )
          }
          &nbsp;&nbsp;{collection.name || ''}
        </div>
      </div>
      {
        mints.length > 0 &&
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
        </div>
      }
      {
        collectors.length > 0 &&
        <div>
          <div style={{ padding: '0em 1em', maxWidth: '500px', margin: '0 auto' }}>
            <div className='section-header'>Top collectors</div>
          </div>
          <div style={{ padding: '0 1em', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ padding: '.5em 1.5em' }}>
              <ol style={{ paddingInlineStart: '1em' }}>
                {
                  collectors.map(collector => {
                    const spentWei = parseInt(collector.spent) > 100000 ? (collector.spent + '000000000') : null;
                    const spentEth = spentWei && parseFloat(ethers.utils.formatEther(spentWei)).toFixed('4');
                    return (
                      <li key={collector.recipient} style={{ marginBottom: '.25em' }}>
                        <Link
                          className='collection-link'
                          to={`/account/${collector.recipient}`}
                        >
                          {ens[collector.recipient] || (collector.recipient.slice(0, 6) + '...' + collector.recipient.slice(-4))}
                        </Link>
                        <div style={{ color: 'gray', fontSize: '.75em' }}>
                          <span>{collector.collected} collected</span>
                          <span>{spentEth ? ` | ${spentEth} ${chain === 'polygon' ? 'MATIC' : 'ETH'} spent` : ''}</span>
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
    </div>
  );
}

export default Collection;
