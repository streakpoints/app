import React, { useState, useEffect } from 'react'
import styled from 'styled-components';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  getProfile,
} from '../data';
import {
  spTokenContract,
} from './constants';

const data = [
  { date: '2024-01-01', value: 10 },
  { date: '2024-01-02', value: 20 },
  { date: '2024-01-03', value: 15 },
  { date: '2024-01-04', value: 25 },
  { date: '2024-01-05', value: 30 },
  // Add more data as needed
];
function Profile() {
  const { address } = useParams();
  const [profile, setProfile] = useState({
    checkins: [],
    referrals: [],
    metadata: {},
    ens: null,
  });
  useEffect(() => {
    getProfile({ address }).then(p => setProfile(p));
  }, [address]);
  window.console.log(profile.checkins);
  const options = { month: 'short', day: 'numeric' };

  return (
    <div>
      <div style={{ fontSize: '24px' }}>
        {profile.ens || `${address.substr(0, 6)}...${address.slice(-4)}`}
        {' '}
        <a
          style={{ textDecoration: 'none' }}
          href={`https://polygonscan.com/token/${spTokenContract}?a=${address}`}
          target='_blank'
        >
          ↗
        </a>
      </div>
      <br />
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={profile.checkins.map(c => ({
            date: new Date(c.create_time).toLocaleDateString('en-US', options),
            points: c.points
          }))}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="points" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
      <br />
      <div className="flex">
        <div className="flex-grow">
          <div>Current Streak: {profile.metadata.currentStreak || 0}</div>
          <div>Longest Streak: {profile.metadata.longestStreak || 0}</div>
        </div>
        <div className="flex-grow">
          <div>Current Points: {profile.metadata.checkinPoints || 0}</div>
          <div>Pending Points: {profile.metadata.pendingPoints || 0}</div>
        </div>
      </div>
      <br />
      {
        profile.referrals.length > 0 && (
          <div>
            <h3>Referred Streakers</h3>
            <STable>
              <tbody>
                {
                  profile.referrals.map(r => (
                    <tr key={`${r.address}-ref`}>
                      <td>
                        <Link to={`/${r.address}`}>
                          {r.name || (`${r.address.substr(0, 6)}...${r.address.substr(-4)}`)}
                        </Link>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </STable>
          </div>
        )
      }
    </div>
  );
};

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

export default Profile;