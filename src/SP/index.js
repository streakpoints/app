import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import 'react-phone-number-input/style.css';
import '@rainbow-me/rainbowkit/styles.css';
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  useAccount,
  useSignMessage,
} from 'wagmi';
import Countdown from 'react-countdown';
import { Modal } from './Modal';
import CheckinButton from './CheckinButton';
import {
  spTokenContract,
} from './constants';
import {
  getAccount,
  getLoginNonce,
  sendPhonePin,
  confirmPhonePin,
  login,
  logout,
  getCheckins,
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
  const [rerender, setRerender] = useState(0);
  const epochEndTime = new Date((Math.floor((new Date().getTime() / 86_400_000)) + 1) * 86_400_000);


  const {
    address,
    // isConnecting,
    isDisconnected,
  } = useAccount();

  const {
    data: loginSignData,
    // isIdle: signIdle,
    isSuccess: loginSignSuccess,
    signMessage: signLoginMessage,
  } = useSignMessage({
    message: `Signing in to StreakPoints. Code: ${loginNonce}`,
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
    if (!phonePin || phonePin.length != 6) {
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
    if (loginSignSuccess && loginSignData) {
      login({ address, signature: loginSignData })
      .then(account => {
        setAccount(account);
        setView(VIEWS.NONE);
      })
      .catch(e => setError(e.message));
    }
  }, [loginSignSuccess, loginSignData]);

  const onCheckin = (txid) => {
    window.alert('Checkin submitted to the blockchain for verification');
    const existingLocal = window.localStorage.getItem('sp-transactions');
    window.localStorage && window.localStorage.setItem('sp-transactions', `${new Date().getTime()}:${txid}${existingLocal ? `,${existingLocal}` : ''}`);
    setRerender(rerender + 1);
  }

  const onCheckinError = (errorCode) => {
    if (errorCode === 0) {
      setView(VIEWS.LOGIN);
    } else if (errorCode === 1) {
      setView(VIEWS.CONFIRM_PHONE_PIN);
    }
  }

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
  const localTransactionData = window.localStorage.getItem('sp-transactions');
  const localTransactions = localTransactionData ? localTransactionData.split(',').map(ut => {
    const [time, txid] = ut.split(':');
    return {
      elapsed: getTimeAgo(Math.floor((now - time) / 1000)),
      txid,
    }
  }) : [];

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
          Let&apos;s create the most valuable place on the internet.
        </p>
        <p>
          Each day you checkin here, you earn 1 point.
          One million $SP is distributed daily to people based on their points.
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
          <CheckinButton onSuccess={onCheckin} onError={onCheckinError} account={account} />
        </div>
        <br />
        <br />
        {
          account && (
            <div>
              <h3>Bonus Points - Referral link</h3>
              <p>Refer someone new who checks in and you&apos;ll both earn 1 extra point.</p>
              <pre>
                <a href={`https://streakpoints.com/?ref=${account.address}`}>
                  https://streakpoints.com/?ref={account.address}
                </a>
              </pre>
              <br />
              <br />
            </div>
          )
        }
        {
          localTransactions.length > 0 && (
            <div style={{ position: 'relative', marginBottom: '2em' }}>
              <h3>
                Checkins from this device
                <Button
                  secondary style={{ zoom: '.5', top: '-.2em', right: '-.5em', position: 'relative' }}
                  onClick={() => {
                    window.localStorage.removeItem('sp-transactions');
                    setRerender(rerender + 1);
                  }}
                >
                  clear
                </Button>
              </h3>
              {
                localTransactions.map(ut => (
                  <div key={ut.txid} style={{ marginBottom: '1em' }}>
                    <a target='_blank' href={`https://polygonscan.com/tx/${ut.txid}`}>{ut.elapsed}</a>
                  </div>
                ))
              }
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
                    <a href={`https://polygonscan.com/token/${spTokenContract}?a=${c.address}`} target='_blank'>{c.name || (`${c.address.substr(0, 6)}...${c.address.substr(-4)}`)}</a>
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
              <Button disabled={loading || !isPossiblePhoneNumber(phoneNumber || '')} onClick={sendPin}>
                Send Pin
                {loading && <i className='fas fa-spinner fa-spin' style={{ marginLeft: '.5em' }} />}
              </Button>
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
              <Button disabled={loading || !phonePin || phonePin.length !== 6} onClick={confirmPin}>
                Confirm Pin
                {loading && <i className='fas fa-spinner fa-spin' style={{ marginLeft: '.5em' }} />}
              </Button>
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
              <Button disabled={loading} onClick={() => signLoginMessage()}>
                Sign In
                {loading && <i className='fas fa-spinner fa-spin' style={{ marginLeft: '.5em' }} />}
              </Button>
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
  background-color: ${props => props.secondary ? '#666' : 'rgb(14, 118, 253)'};
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
`;

export default SP;
