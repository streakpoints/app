import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import 'react-phone-number-input/style.css';
import '@rainbow-me/rainbowkit/styles.css';
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input';
import { ConnectButton, darkTheme } from '@rainbow-me/rainbowkit';
import {
  Link,
  Route,
  Routes,
} from 'react-router-dom';
import {
  useLocation,
} from 'react-router';
import {
  useAccount,
  useSignMessage,
} from 'wagmi';
import { Modal } from './Modal';
import Home from './Home';
import Rules from './Rules';
import Profile from './Profile';
import Leaderboard from './Leaderboard';
import {
  getAccount,
  getLoginNonce,
  sendPhonePin,
  confirmPhonePin,
  login,
  logout,
} from '../data';

const VIEWS = {
  NONE: 0,
  LOGIN: 1,
  SEND_PHONE_PIN: 2,
  CONFIRM_PHONE_PIN: 3,
  FOLLOW_REMINDER: 4,
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
  const [lastCheckin, setLastCheckin] = useState(0);
  const [edition, setEdition] = useState(336000000);
  const { pathname } = useLocation();

  useEffect(() => {
    setTimeout(() => {
      if (edition + 1 === 336000400) {
        setEdition(336000000);
      } else {
        setEdition(edition + 1);
      }
    }, 18 * 60 * 1_000);
  }, [edition]);

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
      const acct = await confirmPhonePin({ phoneNumber, phonePin });
      setAccount(acct);
      setView(VIEWS.FOLLOW_REMINDER);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => loadAccount(), []);

  useEffect(() => {
    if (loginSignSuccess && loginSignData) {
      login({ address, signature: loginSignData })
      .then(account => {
        setAccount(account);
        setView(account && account.verified ? VIEWS.FOLLOW_REMINDER : VIEWS.NONE);
      })
      .catch(e => setError(e.message));
    }
  }, [loginSignSuccess, loginSignData]);

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

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '1em', right: 'calc(2em + 40px)' }}>
        <ButtonWrapper>
          <ConnectButton label="Connect" accountStatus={{ smallScreen: 'address', largeScreen: 'address' }} />
        </ButtonWrapper>
      </div>
      <div style={{ position: 'absolute', top: '1em', right: '1em' }}>
        <iframe src={`https://generator.artblocks.io/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/${edition}`} style={{ border: '0', height: '38px', width: '38px', border: '1px solid #1A1B1F', }} />
      </div>
      <div style={{ padding: '1em 1em', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '0em', textAlign: 'center' }}>
          <Name>💫</Name>
          <br />
          <div>StreakPoints</div>
        </div>
      </div>
      <br />
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 1em 2em 1em' }}>
        <div>
          <SLink
            isSelected={pathname === "/"}
            to="/"
          >
            Home
          </SLink>
          &nbsp;&nbsp;
          <SLink
            isSelected={pathname === "/leaderboard"}
            to="/leaderboard"
          >
            Leaderboard
          </SLink>
          &nbsp;&nbsp;
          <SLink
            isSelected={pathname === "/rules"}
            to="/rules"
          >
            Rules
          </SLink>
          &nbsp;&nbsp;
          {
            account && (
              <SLink
                isSelected={pathname === `/${account.address}`}
                to={`/${account.address}`}
              >
                Profile
              </SLink>
            )
          }
        </div>
        <br />
        <Routes>
          <Route path='/leaderboard' element={<Leaderboard />} />
          <Route path='/rules' element={<Rules />} />
          <Route path='/:address' element={<Profile />} />
          <Route path='/' element={<Home onCheckinError={onCheckinError} account={account} />} />
        </Routes>
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
          view === VIEWS.FOLLOW_REMINDER && (
            <div>
              <h2>Follow us on X</h2>
              <p>Follow <a href="https://x.com/StreakPoints" target="_blank">@StreakPoints</a> for the latest updates and information</p>
              <br />
              <Button
                onClick={() => {
                  window.open('https://x.com/intent/follow?screen_name=StreakPoints', '_blank');
                  setView(VIEWS.NONE);
                }}
               >
                Follow
              </Button>
            </div>
          )
        }
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
      <div style={{ padding: '1em', textAlign: 'center' }}>
        {'Now playing '}
        <a target="_blank" href={`https://opensea.io/assets/ethereum/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/${edition}`}>Polychrome Music #{edition - 336000000}</a>
        <br />
        {'Created by '}
        <a target="_blank" href="https://opensea.io/newrafael/created">newrafael</a>
      </div>
    </div>
  );
}

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

const SLink = styled(Link)`
  font-size: 24px;
  text-decoration: ${({ isSelected }) => isSelected ? 'none' : 'underline'};
`;

const Name = styled.div`
  font-size: 70px;
  width: 80px;
  display: inline-block;
  border: 0px solid white;
  padding: .2em;
  height: 80px;
  margin-top: 1em;
`;

export default SP;
