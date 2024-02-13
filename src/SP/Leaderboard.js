import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import {
  getTopStreaks,
  getTopPoints,
} from '../data';

function Leaderboard(props) {
  const [streaks, setStreaks] = useState([]);
  const [points, setPoints] = useState([]);
  const [lastCheckin, setLastCheckin] = useState(0);
  const epochEndTime = new Date((Math.floor((new Date().getTime() / 86_400_000)) + 1) * 86_400_000);

  const loadStats = async () => {
    const streaks = await getTopStreaks();
    setStreaks(streaks);
    const points = await getTopPoints();
    setPoints(points);
  }

  useEffect(() => loadStats(), []);

  const getTimeAgo = (elapsed) => {
    if (elapsed < 60) {
      return 'just now';
    } else if (elapsed < 3600) {
      return `${Math.floor(elapsed / 60)}m ago`;
    } else if (elapsed < 86400) {
      return `${Math.floor(elapsed / 3600)}h ago`;
    } else {
      return `${Math.floor(elapsed / 86400)}d ago`;
    }
  };

  const now = new Date().getTime();

  const epochDiff = lastCheckin - Math.floor((now / (1000 * 86400)));

  return (
    <div>
      <h3>Longest streaks</h3>
      <STable>
        <thead>
          <tr>
            <th>account</th>
            <th>streak</th>
          </tr>
        </thead>
        <tbody>
          {
            streaks.map(c => (
              <tr key={`${c.address}-${c.epoch}`}>
                <td>
                  <Link to={`/${c.address}`}>{c.name || (`${c.address.substr(0, 6)}...${c.address.substr(-4)}`)}</Link>
                  <br />
                  <span style={{ fontWeight: 'bold', fontSize: '.75em', color: '#666' }}>{getTimeAgo(c.elapsed)}</span>
                  {
                    c.sp > 0 && (
                      <span style={{ fontWeight: 'bold', fontSize: '.75em', color: '#666', marginLeft: '.5em' }}>+{c.sp} $SP</span>
                    )
                  }
                </td>
                <td>{c.streak} day{c.streak === 1 ? '' : 's'}</td>
              </tr>
            ))
          }
        </tbody>
      </STable>
      <h3>Most points</h3>
      <STable>
        <thead>
          <tr>
            <th>account</th>
            <th>points</th>
          </tr>
        </thead>
        <tbody>
          {
            points.map(c => (
              <tr key={`${c.address}-${c.epoch}`}>
                <td>
                  <Link to={`/${c.address}`}>{c.name || (`${c.address.substr(0, 6)}...${c.address.substr(-4)}`)}</Link>
                  <br />
                  <span style={{ fontWeight: 'bold', fontSize: '.75em', color: '#666' }}>{getTimeAgo(c.elapsed)}</span>
                  {
                    c.sp > 0 && (
                      <span style={{ fontWeight: 'bold', fontSize: '.75em', color: '#666', marginLeft: '.5em' }}>+{c.sp} $SP</span>
                    )
                  }
                </td>
                <td>{c.points}</td>
              </tr>
            ))
          }
        </tbody>
      </STable>
    </div>
  );
}

const STable = styled.table`
  width: 100%;
  text-align: right;
  & td {
    padding-bottom: .25em;
  }
  & tr > *:first-child {
    text-align: left;
  }
`;

export default Leaderboard;
