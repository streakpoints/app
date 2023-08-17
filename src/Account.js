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

function Account(props) {
  const { chain, userAddress } = props.match.params;
  const [mints, setMints] = useState([]);
  const [ens, setENS] = useState({});
  const dims = '200px';
  useEffect(() => {
    data.getENS({
      addresses: userAddress
    }).then(e => {
      setENS(e);
    });
    data.getAccountTokens({
      userAddress,
      limit: 9,
      offset: 0,
    }).then(async r => {
      const mintsWithMetadata = await Promise.all(r.map(addMetadataToMint));
      setMints(mintsWithMetadata);
    });
  }, []);
  return (
    <div>
      <div style={{ padding: '2em 1em', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '1em', wordWrap: 'break-word' }}>
          {
            <span style={{ cursor: 'pointer' }} className='nav-link' onClick={() => window.history.back()}>⇦</span>
          }
          &nbsp;&nbsp;{ens[userAddress] || userAddress}
        </div>
      </div>
      {
        mints.length > 0 &&
        <div>
          <div style={{ padding: '0em 1em', maxWidth: '500px', margin: '0 auto' }}>
            <div className='section-header'>Recent mints from this collector</div>
          </div>
          <div style={{ padding: '2em 1em', maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            {
              mints.filter(m => m.image).map(m => (
                <div style={{ display: 'inline-block', verticalAlign: 'top', padding: '.5em', minWidth: dims }}>
                  <Link to={`/${chains[m.chain_id]}/${m.contract_address}`}>
                    <img alt='nft' src={m.image} style={{ maxWidth: dims, maxHeight: dims, backgroundColor: '#fafafa' }} />
                  </Link>
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
    </div>
  );
}

export default Account;
