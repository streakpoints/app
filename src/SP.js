import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import 'react-phone-number-input/style.css';
import '@rainbow-me/rainbowkit/styles.css';
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage, useContractWrite } from 'wagmi';
import Countdown from 'react-countdown';

import { Modal } from './Modal';
import {
  getAccount,
  getLoginNonce,
  getCheckinVerification,
  sendPhonePin,
  confirmPhonePin,
  login,
  logout,
  getCheckins,
} from './data';

const abiSP = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"streak","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"points","type":"uint256"}],"name":"Checkin","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"EPOCH_COIN_ISSUANCE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"EPOCH_DURATION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"acceptAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"verifier","type":"address"}],"name":"addVerifier","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"checkin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountCheckinReward","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountCurrentStreak","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountIsCheckedIn","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountLastCheckinEpoch","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountLongestStreak","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountPoints","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentEpoch","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentEpochPointTotal","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"getEpochPointTotal","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getEpochTimeRemaining","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"verifier","type":"address"}],"name":"getVerified","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getVerifierAdmin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"forwarder","type":"address"}],"name":"isTrustedForwarder","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"nominee","type":"address"}],"name":"nominateAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"verifier","type":"address"}],"name":"removeVerifier","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"versionRecipient","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}];

const two = (number) => (number / 100).toFixed(2).split('.')[1];

const renderer = ({
  days, hours, minutes, seconds, completed,
}) => {
  let text = null;
  if (completed) {
    // Render a completed state
    text = 'Contest complete';
  }
  if (days === 1) {
    text = '1 day';
  } else if (days > 1) {
    text = `${days} days`;
  } else {
    text = `${two(hours)}:${two(minutes)}:${two(seconds)}`;
  }
  text += ' left to checkin today';
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

const VIEWS = {
  NONE: 0,
  LOGIN: 1,
  SEND_PHONE_PIN: 2,
  CONFIRM_PHONE_PIN: 3,
};

function SP(props) {
  const [init, setInit] = useState(false);
  const [error, setError] = useState('');
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginNonce, setLoginNonce] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phonePin, setPhonePin] = useState('');
  const [view, setView] = useState(VIEWS.NONE);
  const [checkins, setCheckins] = useState([]);
  const epochEndTime = new Date((Math.floor((new Date().getTime() / 86_400_000)) + 1) * 86_400_000);

  const {
    address,
    // isConnecting,
    isDisconnected,
  } = useAccount();

  const {
    data: signData,
    // isIdle: signIdle,
    isSuccess: signSuccess,
    signMessage,
  } = useSignMessage({
    message: `Signing in to StreakPoints. Code: ${loginNonce}`,
  });

  const {
    data: writeData,
    // isLoading: writeLoading,
    isSuccess: writeSuccess,
    error: writeError,
    write,
  } = useContractWrite({
    address: '0x89cD4930cAB950dc4594C352Dee828dE917Dd141',
    abi: abiSP,
    functionName: 'checkin',
  });


  const loadAccount = async () => {
    const account = await getAccount();
    if (account) {
      setAccount(account);
    }
    const checkins = await getCheckins();
    setCheckins(checkins);
    setInit(true);
  }

  const logoutServer = async () => {
    setAccount(null);
    await logout();
  };

  const viewLogin = async () => {
    setError(null);
    const nonce = await getLoginNonce();
    setLoginNonce(nonce);
    setView(VIEWS.LOGIN);
  };

  const checkin = async () => {
    try {
      setError(null);
      const verification = await getCheckinVerification();
      write({ args: [verification], from: address });
    } catch (e) {
      console.log(e);
      setError(e.message);
    }
  };

  const sendPin = async () => {
    setLoading(true);
    setError(null);
    try {
      await sendPhonePin({ phoneNumber });
      setView(VIEWS.CONFIRM_PHONE_PIN);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  const confirmPin = async () => {
    setLoading(true);
    setError(null);
    if (!phonePin || phoneNumber.length != 6) {
      setError('Pin must be 6 digits');
      setLoading(false);
      return;
    }
    try {
      await confirmPhonePin({ phoneNumber, phonePin });
      setView(VIEWS.NONE);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => loadAccount(), [])

  useEffect(() => {
    if (signSuccess && signData) {
      login({ address, signature: signData })
      .then(account => {
        setAccount(account);
        setView(VIEWS.NONE);
      })
      .catch(e => setError(e.message));
    }
  }, [signSuccess, signData]);

  useEffect(() => {
    if (writeSuccess && writeData) {
      window.alert('Checkin broadcast! Make sure it gets confirmed');
    }
  }, [writeSuccess, writeData]);

  // Sync Backend auth state based on client wallet
  useEffect(() => {
    if (init) {
      if (
        account && (!address || (address !== account.address))
      ) {
        logoutServer();
        setView(VIEWS.NONE);
      } else if (!account && address) {
        viewLogin();
      } else if (account && !account.verified) {
        setView(VIEWS.SEND_PHONE_PIN);
      }
    }
  }, [init, account, address, isDisconnected]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '1em', right: '1em' }}>
        <ConnectButton />
      </div>
      <div style={{ padding: '2em 1em', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '1em' }}>
          💫&nbsp;&nbsp;StreakPoints
        </div>
        <p>
          StreakPoints is about showing committment and earning along the way.
          Each day you continue your streak (by checking in here) you earn 1 point.
          If your streak is longer than 1 day, you earn $SP as well.
          One million $SP is distributed to people based on their points.
          If you miss a checkin, you lose ½ your points.
          Try not to do that. GLHF!
        </p>
      </div>
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 1em 2em 1em' }}>
        {
          epochEndTime && (
            <Countdown
              date={epochEndTime.getTime()}
              renderer={renderer}
            />
          )
        }
        <div style={{ textAlign: 'center' }}>
          <Button disabled={!write} onClick={checkin}>Checkin</Button>
        </div>
        <br />
        <br />
        {
          view === VIEWS.NONE && (
            <div style={{ color: 'red' }}>
              {error || writeError?.message.split('\n\n')[0]}
            </div>
          )
        }
        <h3>Recent checkins</h3>
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
                    <a href={`https://polygonscan.com/token/0x89cd4930cab950dc4594c352dee828de917dd141?a=${c.address}`} target='_blank'>{c.name || (`${c.address.substr(0, 6)}...${c.address.substr(-4)}`)}</a>
                    <br />
                    +{c.sp} $SP
                  </td>
                  <td>{c.streak}</td>
                  <td>{c.points}</td>
                </tr>
              ))
            }
          </tbody>
        </STable>
      </div>
      <Modal
        presented={view !== VIEWS.NONE}
        modalWidth='500px'
        onClose={() => {
          setView(VIEWS.NONE);
          setError(null);
          setPhonePin('');
          setPhoneNumber('');
        }}
      >
        {
          view === VIEWS.SEND_PHONE_PIN && (
            <div>
              <h2>Confirm your phone</h2>
              <p>Enter your phone to receive a text and confirm your not a bot. We do not store your phone number (only a hash to prevent abuse).</p>
              <PhoneInput
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={setPhoneNumber}
              />
              <br />
              <Button disabled={!isPossiblePhoneNumber(phoneNumber || '')} onClick={sendPin}>Send Pin</Button>
              <div style={{ color: 'red' }}>
                {error}
              </div>
            </div>
          )
        }
        {
          view === VIEWS.CONFIRM_PHONE_PIN && (
            <div>
              <h2>Confirm the code</h2>
              <p>We just texted you a pin code. Enter it below:</p>
              <input
                className="PhoneInputInput"
                placeholder="Enter pin code"
                value={phonePin}
                onChange={(e) => setPhonePin(e.target.value)}
              />
              <br />
              <br />
              <Button disabled={loading || !phonePin || phonePin.length !== 6} onClick={confirmPin}>Confirm Pin</Button>
              <div style={{ color: 'red' }}>
                {error}
              </div>
            </div>
          )
        }
        {
          view === VIEWS.LOGIN && (
            <div>
              <h2>Sign in</h2>
              <p>Click the sign in button below to sign in using your wallet</p>
              <Button disabled={loading} onClick={() => signMessage()}>Sign In</Button>
              <div style={{ color: 'red' }}>
                {error}
              </div>
            </div>
          )
        }
      </Modal>
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
  background-color: rgb(14, 118, 253);
  color: white;
  font-size: 1em;
  font-weight: bold;
  border-radius: 12px;
  border: 0;
  padding: .75em 1em;
  &:disabled {
    background-color: rgb(14, 118, 253, .6);
    cursor: not-allowed;
  }
`

export default SP;
