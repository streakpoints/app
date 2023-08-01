import React, { useState, useEffect } from 'react';
import styled, { withTheme } from 'styled-components';
import * as d3 from 'd3';
import * as data from './data';
import Collection from './Collection';

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

const chains = {
  1: 'ethereum',
  137: 'polygon',
  7777777: 'zora',
};

function Start(props) {
  const [recent, setRecent] = useState({});
  const [d3Loaded, setD3Loaded] = useState(false);
  const [collectionMap, setCollectionMap] = useState({});
  const [collectionOverlaps, setCollectionOverlaps] = useState({});
  const [collectionCollectorCounts, setCollectionCollectorCounts] = useState({});

  const [collectionContract, setCollectionContract] = useState(null);
  const [collectionChain, setCollectionChain] = useState(null);
  const [network, setNetwork] = useState(0);
  const [limit, setLimit] = useState(30);
  const [loading, setLoading] = useState(true);

  // const check = () => {
  //   if (window.d3) {
  //     setD3Loaded(true);
  //   }
  //   else {
  //     setTimeout(check, 250);
  //   }
  // };

  useEffect(() => {
    // check();
    // const s = document.createElement('script');
    // s.type = 'text/javascript';
    // s.src = 'https://d3js.org/d3.v5.js';
    // document.head.appendChild(s);

    data.getRecentTokens({
    }).then(r => {
      setRecent(r);
      const userCollections = {};
      const collectionMap = {};
      const collectionCollectors = {};
      r.contracts.forEach((contract, i) => {
        collectionMap[i + 1] = {
          contract
        };
      });
      [1,137,7777777].forEach(chainID => {
        const results = r[chainID];
        for (let i = 0; i < results.u.length; i++) {
          const user = results.u[i];
          const collection = results.c[i];
          if (!userCollections[user]) {
            userCollections[user] = {};
          }
          if (!collectionCollectors[collection]) {
            collectionCollectors[collection] = {};
          }
          collectionCollectors[collection][user] = true;
          userCollections[user][collection] = true;
          collectionMap[collection].chain = chainID;
        }
      });
      const collectionCollectorCounts = {};
      Object.keys(collectionCollectors).forEach(cc => collectionCollectorCounts[cc] = Object.keys(collectionCollectors[cc]).length);
      const collectionOverlaps = {};
      Object.keys(userCollections).forEach(userID => {
        Object.keys(userCollections[userID]).forEach((collection, i, collections) => {
          if (!collectionOverlaps[collection]) {
            collectionOverlaps[collection] = {};
          }
          for (let j = i + 1; j < collections.length; j++) {
            if (!collectionOverlaps[collection][collections[j]]) {
              collectionOverlaps[collection][collections[j]] = 0;
            }
            collectionOverlaps[collection][collections[j]]++;
          }
        })
      });
      setCollectionCollectorCounts(collectionCollectorCounts);
      setCollectionOverlaps(collectionOverlaps);
      setCollectionMap(collectionMap);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading) {
      loadCharts();
    }
  }, [loading]);

  const loadCharts = () => {
    const networks = (network == 0) ? [1,137,7777777] : [network];
    const includedCollections = Object.keys(collectionCollectorCounts)
    .filter(cid => networks.includes(collectionMap[cid].chain))
    .sort((a, b) => collectionCollectorCounts[a] > collectionCollectorCounts[b] ? -1 : 1)
    .slice(0, limit);
    console.log(networks, includedCollections);

    const includedCollectionMap = {};
    includedCollections.forEach(c => includedCollectionMap[c] = true);

    const nodes = includedCollections.map(n => ({
      label: '',//n.toString(),
      id: n.toString(),
      influence: 1,
      zone: 1,
    }));
    const links = [];
    includedCollections.forEach(sourceCollection => {
      Object.keys(collectionOverlaps[sourceCollection])
      .filter(targetCollection => includedCollectionMap[targetCollection])
      .forEach(targetCollection => {
        links.push({
          source: sourceCollection.toString(),
          target: targetCollection.toString(),
          weight: Math.sqrt(collectionOverlaps[sourceCollection][targetCollection]),
        });
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
    .attr('r', d => 10 + Math.sqrt(Math.sqrt(collectionCollectorCounts[d.id])))
    .attr('id', d => `circle-${d.id}`)
    .style('opacity', 0.5)
    .style('stroke', 'grey')
    .style('stroke-opacity', 0.3)
    .style('stroke-width', d => 2)
    .style('fill', 'grey');

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
      setCollectionChain(chains[collectionMap[d.id].chain]);
      setCollectionContract(collectionMap[d.id].contract);
      const newStroke = 'yellow';
      const newStrokeIn = 'blue';
      // const newStrokeOut = 'red';
      const newOpacity = 0.6;

      d3.selectAll('circle').style('stroke-opacity', 'black').style('opacity', 0.5).style('fill', 'black');
      d3.selectAll('.links').style('stroke', 'grey').style('opacity', 0.25);
      d3.selectAll('text').style('opacity', 0.25);

      // extract node's id and ids of its neighbors
      const id = d.id;
      const neighborS = neighborSource[id];
      const neighborT = neighborTarget[id];
      d3.selectAll(`#circle-${id}`)
      .style('stroke-opacity', newOpacity)
      .style('opacity', 1)
      .style('stroke', newStroke)
      .style('fill', newStroke);

      d3.selectAll(`#label-${id}`).style('opacity', 1);


      // highlight the current node and its neighbors
      for (let i = 0; i < neighborS.length; i++) {
        d3.selectAll(`#line-${neighborS[i]}-${id}`).style('stroke', newStrokeIn).style('opacity', 1);
        d3.selectAll(`#circle-${neighborS[i]}`).style('stroke-opacity', newOpacity).style('stroke', newStrokeIn);
        d3.selectAll(`#label-${neighborS[i]}`).style('opacity', 1);
      }
      for (let i = 0; i < neighborT.length; i++) {
        d3.selectAll(`#line-${id}-${neighborT[i]}`).style('stroke', newStrokeIn).style('opacity', 1);
        d3.selectAll(`#circle-${neighborT[i]}`).style('stroke-opacity', newOpacity).style('stroke', newStrokeIn);
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

  return (
    <div>
      <div
        style={{
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
            setCollectionContract(null);
            setCollectionChain(null);
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
        collectionContract && (
          <div
            style={{
              overflowY: 'scroll',
              backgroundColor: 'white',
              position: 'fixed',
              right: '0',
              width: '50vw',
              height: '100vh',
              boxShadow: '0 0 5px #999'
            }}
          >
            <Collection
              onClickBack={() => {
                setCollectionContract(null);
                setCollectionChain(null);
              }}
              match={{ params: { contractAddress: collectionContract, chain: collectionChain } }}
            />
          </div>
        )
      }
    </div>
  );
}

export default Start;
