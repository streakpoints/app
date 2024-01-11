import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import 'react-phone-number-input/style.css';
import '@rainbow-me/rainbowkit/styles.css';
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage, useContractWrite } from 'wagmi';
import Countdown from 'react-countdown';
import { ethers } from 'ethers';

import { getBiconomy } from './biconomy';
import {
  getCheckinVerification,
} from '../data';

import {
  spGameABI,
  spGameContract,
  spTokenContract,
} from './constants';

const getReferrer = () => {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get('ref');
};

function CheckinButton(props) {
  const {
    onSuccess,
    onError,
    account,
  } = props;
  const [init, setInit] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referrer, setReferrer] = useState(getReferrer());
  const [epochNum, setEpochNum] = useState(null);
  const [gasless, setGasless] = useState(false);

  const {
    address,
  } = useAccount();

  const {
    data: writeData,
    isLoading: writeLoading,
    isSuccess: writeSuccess,
    status,
    error: writeError,
    write,
  } = useContractWrite({
    address: spGameContract,
    abi: spGameABI,
    functionName: 'checkin',
  });

  const epochStr = epochNum ? `0000${epochNum}` : '0';

  const {
    data: checkinSignData,
    isSuccess: checkinSignSuccess,
    isLoading: checkinSignLoading,
    signMessage: signCheckinMessage,
    error: signError,
  } = useSignMessage({
    message: referrer
      ? `StreakPoints checkin from ${address} id:${epochStr} ref:${referrer}`
      : `StreakPoints checkin from ${address} id:${epochStr}`,
  });

  const startGaslessCheckin = async () => {
    const { verification, currentEpoch } = await getCheckinVerification();
    if (currentEpoch != epochNum) {
      setEpochNum(currentEpoch);
    }
  };

  const finishGaslessCheckin = async (userSignature) => {
    const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com/', {
      name: 'Matic',
      chainId: 137,
    });
    const wallet = new ethers.Wallet(`0x000000000000000000000000${address.slice(2)}`)
    const biconomy = await getBiconomy(provider, 'zGd2BlLtI.682b7032-2bf1-431f-8c11-e657299c1300');
    const biconomyProvider = biconomy.getEthersProvider();
    const contract = new ethers.Contract(spGameContract, spGameABI, wallet);
    const {
      verification: verifierSignature,
    } = await getCheckinVerification();
    // Create your target method signature.
    const { data } = await contract.populateTransaction.checkinBySignature(
      epochStr,
      address,
      referrer || '',
      userSignature,
      verifierSignature,
    );

    try {
      const gasLimit = await biconomyProvider.estimateGas({
        to: spGameContract,
        from: address,
        data,
      });

      const txParams = {
        data,
        to: spGameContract,
        from: address,
        gasLimit: gasLimit.toNumber() + 100000,
        signatureType: 'EIP712_SIGN',
      };
      const txid = await biconomyProvider.send('eth_sendTransaction', [txParams]);
      onSuccess(txid);
      setLoading(false);
    } catch (e) {
      console.log(e);
      if (e.message.indexOf('Already checked in') > -1) {
        setError('Already checked in for today');
      } else {
        setError(e.message);
      }
      setLoading(false);
    }
  };

  const checkin = async () => {
    try {
      setError(null);
      setLoading(true);
      if (!address) {
        setError('Connect Wallet first');
        setLoading(false);
        return;
      } else if (!account) {
        onError(0);
        setLoading(false);
        return;
      } else if (!account.verified) {
        onError(1);
        setLoading(false);
        return;
      }
      if (gasless) {
        startGaslessCheckin();
      } else {
        const { verification, currentEpoch } = await getCheckinVerification();
        write({
          args: [
            currentEpoch,
            referrer || '0x0000000000000000000000000000000000000000',
            verification
          ],
          from: address
        });
      }
    } catch (e) {
      console.log(e);
      setError(e.message);
      setLoading(false);
    }
  };

  // CHECKIN EFFECTS
  useEffect(() => {
    if (epochNum) {
      signCheckinMessage();
    }
  }, [epochNum]);

  useEffect(() => {
    if (writeError) {
      const message = writeError.message.split('Contract Call:')[0];
      if (message.indexOf('Already checked in') > -1) {
        setError('Already checked in for today');
      } else {
        setError(message.split('\n')[0]);
      }
      setLoading(false);
    }
  }, [writeError]);

  useEffect(() => {
    if (signError) {
      const { message } = signError;
      setError(message.split('\n')[0]);
      setLoading(false);
    }
  }, [signError]);

  useEffect(() => {
    if (writeSuccess && writeData) {
      onSuccess(writeData.hash);
    }
  }, [writeSuccess, writeData]);

  useEffect(() => {
    if (checkinSignSuccess && checkinSignData) {
      finishGaslessCheckin(checkinSignData);
    }
  }, [checkinSignSuccess, checkinSignData]);


  return (
    <div style={{ position: 'relative' }}>
      <div style={{ textAlign: 'center' }}>
        <Button
          style={{ fontSize: '1.5em' }}
          onClick={checkin} disabled={loading || writeLoading || checkinSignLoading}
        >
          Checkin
          {loading && <i className='fas fa-spinner fa-spin' style={{ marginLeft: '.5em' }} />}
        </Button>
        <br />
        <br />
        <div className="toggle-switch">
          <input
            checked={gasless}
            onChange={() => setGasless(!gasless)}
            type="checkbox"
            className="toggle-switch-checkbox"
            name="gaslessSwitch"
            id="gaslessSwitch"
          />
          <label className="toggle-switch-label" htmlFor="gaslessSwitch">
            <span className="toggle-switch-inner" />
            <span className="toggle-switch-switch" />
          </label>
        </div>
        <label className="toggle-switch-text" for="gaslessSwitch">Gasless ⚠️ beta </label>
      </div>
      <br />
      <br />
      <div style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>
        {error}
      </div>
    </div>
  );
}

const Button = styled.button`
  cursor: pointer;
  background-color: ${props => props.secondary ? '#666' : 'rgb(14, 118, 253)'};
  color: white;
  font-size: 1em;
  font-weight: bold;
  font-family: Trebuchet MS, sans-serif;
  border-radius: 500px;
  text-transform: uppercase;
  border: 0;
  padding: .5em 1em;
  box-shadow: 0px 2px 16px rgba(0, 0, 0, 0.4);
  &:disabled {
    background-color: rgb(14, 118, 253, .6);
    cursor: not-allowed;
  }
`;

export default CheckinButton;
