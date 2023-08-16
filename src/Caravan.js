import React, { useState, useEffect } from 'react';
import styled, { withTheme } from 'styled-components';
import axios from 'axios';
import parseDataUrl from 'parse-data-url';
import { Buffer } from 'buffer';
import * as d3 from 'd3';
import * as data from './data';
import Collection from './Collection';

const normalizeURL = image => {
  if (image.indexOf('ipfs://') === 0) {
    image = image.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  if (image.indexOf('ar://') === 0) {
    image = image.replace('ar://', 'https://arweave.net/');
  }
  return image;
};


const Wrapper = styled.div`
  height: 100vh;
  width: 100vw;
  position: absolute;
  display: flex;
  align-items: center;
  z-index: 0;
  top: 0;
  left: 0;
  .link {
    stroke: #ccc;
  }

  circle, text {
    cursor: pointer;
  }
`;

const PageWrapper = styled.div`
  overflow-y: scroll;
  background-color: white;
  position: fixed;
  right: 0;
  width: 50vw;
  height: 100vh;
  box-shadow: 0 0 5px #999;
  @media(max-width: 800px) {
    width: 100vw;
    height: 70vh;
    bottom: 0;
  }
`;

const chains = {
  1: 'ethereum',
  137: 'polygon',
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
  return [mint.contract_address, image || 'https://cent-resources-prod.s3.us-west-2.amazonaws.com/Screenshot+2023-08-13+at+11.41.05+PM_1691988070933.png'];
};

function Start(props) {
  const [collectionImages, setCollectionImages] = useState({});
  const [collectionChain, setCollectionChain] = useState({});
  const [collectionSpend, setCollectionSpend] = useState({});
  const [collectionOverlaps, setCollectionOverlaps] = useState({});

  const [selectedCollectionContract, setSelectedCollectionContract] = useState(null);
  const [selectedCollectionChain, setSelectedCollectionChain] = useState(null);
  const [network, setNetwork] = useState(0);
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (props.match.params.address) {
      setSelectedCollectionContract(null);
      setSelectedCollectionChain(null);
      setLoading(true);
      d3.select("#network-graph")?.remove();
      loadData(props.match.params.address);
    }
  }, [props.match.params.address]);

  useEffect(() => {
    if (!loading) {
      loadCharts();
    }
  }, [loading]);

  const loadData = async (userAddress) => {
    const r = await data.getRecentTokens({});
    const { userMints, collectionMints } = await data.getUserGraph({ userAddress });

    const collectionCollectors = {
      // collectionA: { collectorA: true, collectorB: true, ... },
      // ...
    };
    const collectionOverlaps = {
      // collectionA: { collectionB: 4, collectionC: 15, ... },
      // ...
    };
    const collectionSpend = {
      // collectionA: 1000,
      // ...
    };
    const collectionChain = {
      // collectionA: 137,
      // ...
    };

    const collectionImages = {};

    const tokenImages = [];

    userMints.forEach(m => {
      if (!collectionCollectors[m.contract_address]) {
        collectionCollectors[m.contract_address] = {};
        collectionOverlaps[m.contract_address] = {};
        collectionSpend[m.contract_address] = 0;
        collectionChain[m.contract_address] = m.chain_id;
        tokenImages.push(getTokenImage(m));
      }
    });
    console.log(tokenImages);

    // Iterate over collection mints and aggregate:
    // 1. Each collections spend
    // 2. Each collections relationship
    collectionMints.forEach(m => {
      collectionCollectors[m.contract_address][m.recipient] = true;
      collectionSpend[m.contract_address] += m.value_gwei;
    });

    const collections = Object.keys(collectionCollectors);
    collections.forEach((aCollection, i) => {
      const aCollectors = Object.keys(collectionCollectors[aCollection]);
      for (let j = i + 1; j < collections.length; j++) {
        const bCollection = collections[j];
        aCollectors.forEach(aCollector => {
          if (collectionCollectors[bCollection][aCollector]) {
            collectionOverlaps[aCollection][bCollection] = 1 + (collectionOverlaps[aCollection][bCollection] || 0);
            collectionOverlaps[bCollection][aCollection] = 1 + (collectionOverlaps[bCollection][aCollection] || 0);
          }
        });
      }
    });

    setCollectionChain(collectionChain);
    setCollectionSpend(collectionSpend);
    setCollectionOverlaps(collectionOverlaps);
    await Promise.all(tokenImages.map(async (result) => {
      const [collection, image] = await result;
      collectionImages[collection] = image;
    }));
    setCollectionImages(collectionImages);
    setLoading(false);
  }

  const loadCharts = () => {
    const networks = (network == 0) ? [1,137,7777777] : [network];
    const includedCollections = Object.keys(collectionChain);
    // .filter(cid => networks.includes(collectionMap[cid].chain))
    // .sort((a, b) => collectionCollectorCounts[a] > collectionCollectorCounts[b] ? -1 : 1)
    // .slice(0, limit);
    const includedCollectionMap = {};
    includedCollections.forEach(c => includedCollectionMap[c] = true);

    const nodes = includedCollections.map(address => ({
      label: '',//n.toString(),
      id: address.toString(),
      image: 'https://images-eu.ssl-images-amazon.com/images/G/02/gc/designs/livepreview/a_generic_10_uk_noto_email_v2016_uk-main._CB485921599_.png',
      influence: 1,
      zone: 1,
    }));
    const links = [];
    const linkCache = {};
    includedCollections.forEach(aCollection => {
      if (!collectionOverlaps[aCollection]) {
        return;
      }
      Object.keys(collectionOverlaps[aCollection])
      .sort((bCollection, cCollection) => {
        const diff = collectionOverlaps[aCollection][bCollection] - collectionOverlaps[aCollection][cCollection];
        if (diff > 0) {
          return -1;
        } else if (diff < 0) {
          return 1;
        } else {
          return collectionSpend[bCollection] > collectionSpend[cCollection] ? -1 : 1
        }
      })
      .filter(bCollection => !linkCache[aCollection + bCollection] && !linkCache[bCollection + aCollection])
      .slice(0, 1)
      .filter(bCollection => includedCollectionMap[bCollection])
      .forEach(bCollection => {
        linkCache[aCollection + bCollection] = true;
        // links.push({
        //   source: aCollection.toString(),
        //   target: bCollection.toString(),
        //   weight: Math.sqrt(collectionOverlaps[aCollection][bCollection]),
        // });
      });
    });

    const width = window.innerWidth;
    const height = window.innerHeight - 4;

    const simulation = d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d.id).distance(250))
    .force('charge', d3.forceManyBody().strength(-200)) // This adds repulsion (if it's negative) between nodes.
    .force('center', d3.forceCenter(width / 4, height / 4)) // This force attracts nodes to the center of the svg area
    .alphaDecay(0.05);

    // Create an SVG element and append it to the DOM
    const elt = document.getElementById('graph-body');

    const svg = d3.select(elt)
    .append('svg')
    .attr('id', 'network-graph')
    .attr('width', width)
    .attr('height', height)
    .call(d3.zoom().on('zoom', () => svg.attr('transform', d3.event.transform)))
    .append('g');

    const computeRadius = (id) => 30 + Math.log2(collectionSpend[id] || 1);

    const defs = svg.append('svg:defs');
    Object.keys(collectionImages).forEach(collection => {
      defs.append('svg:pattern')
      .attr('id', `img-${collection}`)
      .attr('patternUnits', 'objectBoundingBox')
      .attr('width', '1')
      .attr('height', '1')
      .append('svg:image')
      .attr('xlink:href', collectionImages[collection])
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', computeRadius(collection) * 2)
      .attr('height', computeRadius(collection) * 2);
    })

    // Initialize the links
    const link = svg.selectAll('.links')
    .data(links)
    .enter()
    .append('line')
    .attr('class', 'links')
    .attr('stroke', 'grey')
    .attr('stroke-width', d => d.weight)
    .style('opacity', 0.25)
    .attr('id', d => `line-${d.source}-${d.target}`);

    // Initialize the nodes
    const node = svg.selectAll('.nodes')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'nodes');

    node.call(
      d3.drag()
      .on('start', (d) => {
        /* no-param-reassign: "off" */
        simulation.force('link', null);
        simulation.force('charge', null);
        simulation.force('center', null);
        simulation.alpha(1).restart();
        d.fy = d.y; // fx - the node’s fixed x-position. Original is null.
        d.fx = d.x; // fy - the node’s fixed y-position. Original is null.
      })
      .on('drag', (d) => {
        /* eslint no-param-reassign: "off" */
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      })
    );

    node.append('circle')
    .attr('r', d => computeRadius(d.id))
    .attr('id', d => `circle-${d.id}`)
    // .style('opacity', 0.5)
    .style('stroke', 'grey')
    .style('stroke-opacity', 0.3)
    .style('stroke-width', d => 2)
    .style('fill', d => `url(#img-${d.id})`);

    node.append('text')
    .attr('dy', '-1em')
    // .attr('dx', -15)
    .style('fill', '#000000')
    .style('stroke', 'transparent')
    // .style('opacity', .25)
    .attr('id', d => `label-${d.id}`)
    .text(d => d.label);

    // set up dictionary of neighbors
    const neighborTarget = {};
    nodes.forEach(n => (
      neighborTarget[n.id] = links.filter(d => d.source == n.id).map(d => d.target)
    ));
    const neighborSource = {};
    nodes.forEach(n => (
      neighborSource[n.id] = links.filter(d => d.target == n.id).map(d => d.source)
    ));

    const onClickNode = (d) => {
      setSelectedCollectionChain(collectionChain[d.id]);
      setSelectedCollectionContract(d.id);
      const newStroke = 'yellow';
      const newStrokeIn = 'blue';
      // const newStrokeOut = 'red';
      const newOpacity = 0.6;

      d3.selectAll('circle').style('stroke-opacity', 'black')
      // .style('opacity', 0.5).style('fill', 'black');
      d3.selectAll('.links').style('stroke', 'grey').style('opacity', 0.25);
      d3.selectAll('text').style('opacity', 0.25);

      // extract node's id and ids of its neighbors
      const id = d.id;
      const neighborS = neighborSource[id];
      const neighborT = neighborTarget[id];
      d3.selectAll(`#circle-${id}`)
      // .style('stroke-opacity', newOpacity)
      // .style('opacity', 1)
      // .style('stroke', newStroke)
      // .style('fill', newStroke);

      d3.selectAll(`#label-${id}`).style('opacity', 1);


      // highlight the current node and its neighbors
      for (let i = 0; i < neighborS.length; i++) {
        d3.selectAll(`#line-${neighborS[i]}-${id}`).style('stroke', newStrokeIn).style('opacity', 1);
        // d3.selectAll(`#circle-${neighborS[i]}`).style('stroke-opacity', newOpacity).style('stroke', newStrokeIn);
        d3.selectAll(`#label-${neighborS[i]}`).style('opacity', 1);
      }
      for (let i = 0; i < neighborT.length; i++) {
        d3.selectAll(`#line-${id}-${neighborT[i]}`).style('stroke', newStrokeIn).style('opacity', 1);
        // d3.selectAll(`#circle-${neighborT[i]}`).style('stroke-opacity', newOpacity).style('stroke', newStrokeIn);
        d3.selectAll(`#label-${neighborT[i]}`).style('opacity', 1);
      }
    };

    node.selectAll('text').on('click', onClickNode);

    node.selectAll('circle').on('click', onClickNode);

    // node.select('#circle1').on('click')(nodes[1]);

    function ticked() {
      link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    }


    simulation
    .nodes(nodes)
    .on('tick', ticked);

    simulation.force('link')
    .links(links);
  };

  if (!props.match.params.address) {
    return (
      <div
        style={{
          zIndex: '1',
          width: '100vw',
          maxWidth: '300px',
          margin: '0 auto'
        }}
      >
        <div style={{ width: '100%', padding: '5em 1em', boxSizing: 'border-box' }}>
          <span style={{ position: 'relative' }}>
            <input
              type='text'
              placeholder='address'
              style={{
                width: '100%',
                borderRadius: '12px',
                border: '1px solid gray',
                padding: '.5em',
                textAlign: 'center'
              }}
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </span>
          <br />
          <br />
          <button
            style={{ width: '100%' }}
            disabled={address.length !== 42 || address.indexOf('0x') !== 0}
            onClick={() => {
              window.location.href = '/caravan/' + address;
            }}
          >
            go
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'none',
          zIndex: '1',
          backgroundColor: 'transparent',
          position: 'fixed',
          top: '1em',
          left: '1em',
          width: '100vh',
        }}
      >
        <select
          style={{ backgroundColor: 'white', cursor: 'pointer', fontSize: '16px' }}
          onChange={(e) => {
            setNetwork(parseInt(e.target.value));
          }}
        >
          <option selected value={0}>All Networks</option>
          <option value={1}>Ethereum</option>
          <option value={137}>Polygon</option>
          <option value={7777777}>Zora</option>
        </select>
        <span style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: '0', left: '0', padding: '0 1em', color: 'gray' }}>
          Top:
          </span>
          <input
            type='number'
            style={{
              margin: '0 .5em',
              borderRadius: '12px',
              border: '1px solid gray',
              padding: '.5em',
              width: '6em',
              textAlign: 'right'
            }}
            value={limit}
            onChange={e => setLimit(e.target.value ? Math.min(e.target.value || 0, 1000) : '')}
          />
        </span>
        <button
          onClick={() => {
            setSelectedCollectionContract(null);
            setSelectedCollectionChain(null);
            d3.select("#network-graph").remove();
            loadCharts();
          }}
        >
          redraw
        </button>
      </div>
      {
        loading ? (
          <Wrapper>
            <div style={{ textAlign: 'center', width: '100%' }}>loading...</div>
          </Wrapper>
        ) : (
          <Wrapper id='graph-body' />
        )
      }
      {
        selectedCollectionContract && (
          <PageWrapper>
            <Collection
              onClickBack={() => {
                setSelectedCollectionContract(null);
                setSelectedCollectionChain(null);
              }}
              onSelectCollection={({ contract, chain }) => {
                setSelectedCollectionContract(contract);
                setSelectedCollectionChain(chain);
              }}
              match={{ params: { contractAddress: selectedCollectionContract, chain: chains[selectedCollectionChain] } }}
            />
          </PageWrapper>
        )
      }
    </div>
  );
}

export default Start;
