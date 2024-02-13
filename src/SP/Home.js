import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  useAccount,
} from 'wagmi';
import { Link } from 'react-router-dom';
import Countdown from 'react-countdown';
import CheckinButton from './CheckinButton';
import {
  spTokenContract,
} from './constants';
import {
  getCheckins,
  getTopStreaks,
  getTopPoints,
  getEpochStats,
  getLastCheckin,
} from '../data';

const two = (number) => (number / 100).toFixed(2).split('.')[1];

const renderer = ({
  days, hours, minutes, seconds, completed,
}) => {
  let text = null;
  if (completed) {
    // Render a completed state
    text = 'Day complete';
  }
  if (days === 1) {
    text = '1 day';
  } else if (days > 1) {
    text = `${days} days`;
  } else {
    text = `${two(hours)}:${two(minutes)}:${two(seconds)}`;
  }
  text += ' left to streak today';
  return (
    <div
      style={{
        fontWeight: 'bold',
        color: 'red',
        textAlign: 'center',
        padding: '0 0 2em 0',
      }}
    >
      {text}
    </div>
  );
};

function Home(props) {
  const [stats, setStats] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [lastCheckin, setLastCheckin] = useState(0);
  const epochEndTime = new Date((Math.floor((new Date().getTime() / 86_400_000)) + 1) * 86_400_000);

  const {
    account,
    onCheckinError,
  } = props;

  const {
    address,
    // isConnecting,
    isDisconnected,
  } = useAccount();

  useEffect(() => {
    if (account && address) {
      getLastCheckin({
        address: account.address
      }).then((lastCheckinEpoch) => {
        setLastCheckin(lastCheckinEpoch);
      });
    } else {
      setLastCheckin(0);
    }
  }, [account, address]);

  const loadStats = async () => {
    const stats = await getEpochStats();
    setStats(stats);
    const checkins = await getCheckins();
    setCheckins(checkins);
  }

  useEffect(() => loadStats(), []);

  const onCheckin = (txid) => {
    window.alert('Checkin submitted to the blockchain for verification');
  }

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
      <div>
        <p>What if everyone with a <a href="https://metamask.io/" target="_blank">crypto wallet</a> came to this site daily?</p>
        <p>StreakPoints is a global game of on-chain streaks. To play, show up once a day and click the <b>STREAK</b> button below before the 24 hour countdown expires. You earn $SP when your streak lasts longer than 1 day.</p>
      </div>
      {
        epochDiff === 0 ? (
          <div
            style={{
              textAlign: 'center',
              fontSize: '32px',
              padding: '1em 0',
              fontWeight: 'bold'
            }}
          >
            💫 You Streaked 💫
          </div>
        ) : (
          <div>
            {
              epochEndTime && (
                <Countdown
                  date={epochEndTime.getTime()}
                  renderer={renderer}
                />
              )
            }
            <div style={{ textAlign: 'center' }}>
              <CheckinButton
                onSuccess={onCheckin}
                onError={onCheckinError}
                account={account}
              />
            </div>
          </div>
        )
      }
      <STable style={{ marginTop: '1em' }}>
        <thead>
          <tr>
            <th></th>
            <th>-6d</th>
            <th>-5d</th>
            <th>-4d</th>
            <th>-3d</th>
            <th>-2d</th>
            <th>-1d</th>
            <th>now</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>streakers</b></td>
            {stats.map(s => (<td>{s.addresses}</td>))}
          </tr>
          <tr>
            <td><b>points</b></td>
            {stats.map(s => (<td>{((s.points || 0) / 1000).toFixed(1)}k</td>))}
          </tr>
        </tbody>
      </STable>
      <br />
      <br />
      {
        account && (
          <div style={{ wordWrap: 'break-word' }}>
            <h3>Your referral link</h3>
            <p>Refer a new streaker and you both earn 1 extra point.</p>
            <a href={`https://streakpoints.com/?ref=${account.address}`}>
              https://streakpoints.com/?ref={account.address}
            </a>
            <br />
            <br />
          </div>
        )
      }
      <h3>Recent streakers</h3>
      <STable>
        <thead>
          <tr>
            <th>account</th>
            <th>streak</th>
            <th>points</th>
          </tr>
        </thead>
        <tbody>
          {
            checkins.map(c => (
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

const Button = styled.button`
  cursor: pointer;
  background-color: ${props => props.secondary ? '#666' : '#2F855A'};
  color: white;
  font-size: 1em;
  font-weight: bold;
  border-radius: 0px;
  border: 0;
  padding: .75em 1em;
  &:disabled {
    background-color: rgb(14, 118, 253, .6);
    cursor: not-allowed;
  }
`;

const ButtonWrapper = styled.div`
  * {
    font-family: "VT323", monospace !important;
    border-radius: 0 !important;
  }
`;

export default Home;
