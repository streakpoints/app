const Biconomy = require('@biconomy/mexa').Biconomy;
const ethers = require('ethers');
const { signTypedData, SignTypedDataVersion } = require('@metamask/eth-sig-util');
const abi721 = require('./721-abi.json');
const abiID = require('./id-abi.json');

const networkID = 1;
const infuraAccessToken = 'e8e7334c5daa415489ab1df636995565';
const TOKENS = {
  CryptoPunks: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb'
};

const getProvider = networkID => {
  if (networkID == 1) {
    return new ethers.providers.InfuraProvider(networkID, infuraAccessToken);
  }
  else if (networkID == 137) {
    return new ethers.providers.JsonRpcProvider('https://polygon-rpc.com/', {
      name: 'Matic',
      chainId: 137
    });
  }
};

const getBiconomy = async (provider, apiKey) => {
  return new Promise((resolve, reject) => {
    const biconomy = new Biconomy(provider, {
      apiKey,
      debug: true
    });
    biconomy.onEvent(biconomy.READY, () => {
      resolve(biconomy);
    }).onEvent(biconomy.ERROR, (error, message) => {
      reject(error);
    });
  });
}

const getContract = (address, provider) => {
  return new ethers.Contract(address, abi721, provider);
};

const getAddressFallback = address => `${address.substr(0, 6)}...${address.substr(-4)}`;

const verifyMessageSignatureAndOwner = async (tokenContract, tokenID, networkID, message, signer, signature) => {
  const recoveredSigner = ethers.utils.verifyMessage(message, signature);
  if (recoveredSigner != signer) {
    throw new Error('invalid signature');
  }
  if (tokenID) {
    const provider = getProvider(networkID);
    const zContract = getContract(tokenContract, provider);
    const owner = tokenContract == TOKENS.CryptoPunks ? (
      await zContract.punkIndexToAddress(tokenID)
    ) : (
      await zContract.ownerOf(tokenID)
    );
    if (owner != signer) {
      throw new Error('not owner');
    }
    const symbol = await zContract.symbol();
    return `${symbol || getAddressFallback(signer)} #${tokenID}`;
  }
  else {
    const ensName = await getENS(signer);
    if (ensName) {
      return ensName;
    }
    return getAddressFallback(signer);
  }
};

const getBroadcastIdentifier = async (address, tokenID, networkID) => {
  if (tokenID) {
    const provider = getProvider(networkID);
    const zContract = getContract(address, provider);
    const symbol = await zContract.symbol();
    return `${symbol || getAddressFallback(address)} #${tokenID}`;
  }
  else {
    const ensName = await getENS(address);
    if (ensName) {
      return ensName;
    }
    return getAddressFallback(address);
  }
};

const getENS = async (address) => {
  const provider = getProvider(1);
  const name = await provider.lookupAddress(address);
  return name;
};

const mint = async (
  biconomyApiKey,
  messageMemo,
  messageRoyaltyRateInteger,
  messageRoyaltyRateDecimal,
  messageRoyaltyOwner,
  messageTokenURI,
  messageSignature
) => {
  const contractInterface = new ethers.utils.Interface(abiID);
  const functionSignature = contractInterface.encodeFunctionData('mintFromSignature', [
    messageMemo,
    messageRoyaltyRateInteger,
    messageRoyaltyRateDecimal,
    messageRoyaltyOwner,
    messageTokenURI,
    messageSignature
  ]);

  const provider = getProvider(137);
  const biconomy = await getBiconomy(provider, biconomyApiKey);
  const biconomyProvider = biconomy.getEthersProvider();

  const metaWallet = ethers.Wallet.createRandom();
  const sender = await metaWallet.getAddress();
  const signedTx = await metaWallet.signTransaction({
    to: '0x178a1Eb0e321846B6137B0D38faF2F68e115a114',
    data: functionSignature,
    from: sender
  });
  const forwardData = await biconomy.getForwardRequestAndMessageToSign(signedTx);

  const signature = signTypedData({
    privateKey: ethers.utils.arrayify(metaWallet.privateKey),
    data: forwardData.eip712Format,
    version: SignTypedDataVersion.V3
  });
  const txnID = await biconomyProvider.send('eth_sendRawTransaction', [{
    signature,
    gasLimit: (Number(forwardData.request.txGas) + 100000).toString(),
    forwardRequest: forwardData.request,
    rawTransaction: signedTx,
    signatureType: biconomy.EIP712_SIGN
  }]);

  if (!txnID || txnID.length == 0) {
    throw new Error('Invalid txn id');
  }
  return txnID;
};

module.exports = {
  verifyMessageSignatureAndOwner,
  getBroadcastIdentifier,
  getENS,
  mint
};

