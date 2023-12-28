import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import 'react-phone-number-input/style.css';
import '@rainbow-me/rainbowkit/styles.css';
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage, useContractWrite } from 'wagmi';
import Countdown from 'react-countdown';
// import { ethers } from 'ethers';
// import { getBiconomy } from './biconomy';

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

const abiSP = [{"inputs":[],"name":"acceptAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"verifier","type":"address"}],"name":"addVerifier","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"},{"internalType":"address","name":"referrer","type":"address"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"checkin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"epochStr","type":"string"},{"internalType":"string","name":"userStr","type":"string"},{"internalType":"string","name":"refUserStr","type":"string"},{"internalType":"bytes","name":"userSig","type":"bytes"},{"internalType":"bytes","name":"verifierSig","type":"bytes"}],"name":"checkinBySignature","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenContract","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":true,"internalType":"address","name":"referrer","type":"address"},{"indexed":false,"internalType":"uint256","name":"streak","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"points","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"coins","type":"uint256"}],"name":"Checkin","type":"event"},{"inputs":[{"internalType":"address","name":"legacyMonolithContract","type":"address"}],"name":"migrate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"nominee","type":"address"}],"name":"nominateAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"verifier","type":"address"}],"name":"removeVerifier","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"EPOCH_COIN_ISSUANCE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"EPOCH_DURATION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountCheckinReward","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountCurrentStreak","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountIsCheckedIn","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountLastCheckinEpoch","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountLastCheckinPoints","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountLongestStreak","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountPoints","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"verifier","type":"address"}],"name":"getAddressIsVerified","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAdmin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentEpoch","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentEpochPointTotal","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"getEpochPointTotal","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getEpochTimeRemaining","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"forwarder","type":"address"}],"name":"isTrustedForwarder","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"versionRecipient","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}];
const contractSP = '0xfb86e23C71EcfD07AF371B290a453704F52B1f9A';

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
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [rerender, setRerender] = useState(0);
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
    isLoading: writeLoading,
    isSuccess: writeSuccess,
    status,
    error: writeError,
    write,
  } = useContractWrite({
    address: contractSP,
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

  // const gaslessCheckin = async () => {
  //   const biconomy = await getBiconomy(provider, 'zGd2BlLtI.682b7032-2bf1-431f-8c11-e657299c1300');
  //   const biconomyProvider = biconomy.getEthersProvider();
  //   const signer = biconomy.getSignerByAddress(address);
  //   const contract = new ethers.Contract(contractSP, abiSP, signer);
  //   const { verification, currentEpoch } = await getCheckinVerification();
  //   // Create your target method signature.
  //   const { data } = await contract.populateTransaction.checkin(currentEpoch, '0x0000000000000000000000000000000000000000', verification);

  //   const gasLimit = await biconomyProvider.estimateGas({
  //     to: contractSP,
  //     from: address,
  //     data,
  //   });

  //   const txParams = {
  //     data,
  //     to: contractSP,
  //     from: address,
  //     gasLimit: gasLimit.toNumber() + 100000,
  //     signatureType: 'EIP712_SIGN',
  //   };

  //   const txid = await biconomyProvider.send('eth_sendTransaction', [txParams]);
  //   const existingLocal = window.localStorage.getItem('sp-transactions');
  //   window.localStorage.setItem('sp-transactions', `${new Date().getTime()}:${txid}${existingLocal ? `,${existingLocal}` : ''}`);
  //   setRerender(rerender + 1);
  // };

  const checkin = async () => {
    try {
      setError(null);
      setLoading(true);
      if (!address) {
        setError('Connect Wallet first');
        setLoading(false);
        return;
      } else if (!account) {
        setView(VIEWS.LOGIN)
        setLoading(false);
        return;
      } else if (!account.verified) {
        setView(VIEWS.SEND_PHONE_PIN);
        setLoading(false);
        return;
      }
      //await gaslessCheckin();
      //*
      const { verification, currentEpoch } = await getCheckinVerification();
      console.log('here');
      write({
        args: [
          currentEpoch,
          '0x0000000000000000000000000000000000000000',
          verification
        ],
        from: address
      });
      //*/
    } catch (e) {
      console.log(e);
      setError(e.message);
    }
    setLoading(false);
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
    if (writeError) {
      const message = writeError.message.split('Contract Call:')[0];
      if (message.indexOf('Already checked in') > -1) {
        setError('Already checked in for today');
      } else {
        setError(message);
      }
    }
  }, [writeError]);

  useEffect(() => {
    if (writeSuccess && writeData) {
      setCheckinSuccess(true);
      console.log(writeData, writeData.hash);
      const txid = writeData.hash;
      const existingLocal = window.localStorage.getItem('sp-transactions');
      window.localStorage && window.localStorage.setItem('sp-transactions', `${new Date().getTime()}:${txid}${existingLocal ? `,${existingLocal}` : ''}`);
    }
  }, [writeSuccess, writeData]);

  useEffect(() => {
    if (checkinSuccess) {
      window.alert('Checkin submitted to the blockchain for verification');
    }
  }, [checkinSuccess]);

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
          <Button onClick={checkin} disabled={loading || writeLoading}>
            Checkin
            {loading && <i className='fas fa-spinner fa-spin' style={{ marginLeft: '.5em' }} />}
          </Button>
        </div>
        <br />
        <br />
        {
          view === VIEWS.NONE && (
            <div style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>
              {error}
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
                    <a href={`https://polygonscan.com/token/${contractSP}?a=${c.address}`} target='_blank'>{c.name || (`${c.address.substr(0, 6)}...${c.address.substr(-4)}`)}</a>
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
              <Button disabled={loading} onClick={() => signMessage()}>
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
`

export default SP;
