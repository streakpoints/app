const ethers = require('ethers');
const axios = require('axios');
const abiSP = [{"inputs":[{"internalType":"address","name":"tokenContract","type":"address"},{"internalType":"address","name":"forkedGameContract","type":"address"},{"internalType":"address","name":"forkedTokenContract","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":true,"internalType":"address","name":"referrer","type":"address"},{"indexed":false,"internalType":"uint256","name":"streak","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"points","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"coins","type":"uint256"}],"name":"Checkin","type":"event"},{"inputs":[],"name":"EPOCH_COIN_ISSUANCE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"EPOCH_DURATION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"acceptAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"verifier","type":"address"}],"name":"addVerifier","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"},{"internalType":"address","name":"referrer","type":"address"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"checkin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"epochStr","type":"string"},{"internalType":"string","name":"userStr","type":"string"},{"internalType":"string","name":"refUserStr","type":"string"},{"internalType":"bytes","name":"userSig","type":"bytes"},{"internalType":"bytes","name":"verifierSig","type":"bytes"}],"name":"checkinBySignature","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountCheckinReward","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountCurrentStreak","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountIsCheckedIn","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountLastCheckinEpoch","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountLastCheckinPoints","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountLongestStreak","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getAccountPoints","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"verifier","type":"address"}],"name":"getAddressIsVerified","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAdmin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentEpoch","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentEpochPointTotal","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"getEpochPointTotal","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getEpochTimeRemaining","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"forwarder","type":"address"}],"name":"isTrustedForwarder","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"nominee","type":"address"}],"name":"nominateAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"verifier","type":"address"}],"name":"removeVerifier","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"versionRecipient","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}];
const abi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"balance","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"operator","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"owner","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"_approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const farcaster = require("@standard-crypto/farcaster-js")
const wallet = ethers.Wallet.fromMnemonic(process.env.FARCASTER_PHRASE);
const walletSP = ethers.Wallet.fromMnemonic(process.env.SP_PHRASE);
const client = new farcaster.MerkleAPIClient(wallet);

const ethereumProvider = new ethers.providers.AlchemyProvider(1, process.env.ALCHEMY_ETHEREUM_KEY);
const polygonProvider = new ethers.providers.AlchemyProvider(137, process.env.ALCHEMY_POLYGON_KEY);
const zoraProvider = new ethers.providers.StaticJsonRpcProvider('https://rpc.zora.energy');
const baseProvider = new ethers.providers.StaticJsonRpcProvider('https://mainnet.base.org');
const optimismProvider = new ethers.providers.StaticJsonRpcProvider('https://mainnet.optimism.io');

const contractSP = '0x0c78A4621C4674BCD110F3a29308a9fE37B2Eb59';

const getProvider = networkID => {
  if (networkID == 1) {
    return ethereumProvider;
  } else if (networkID == 10) {
    return optimismProvider;
  } else if (networkID == 137) {
    return polygonProvider;
  } else if (networkID == 8453) {
    return baseProvider;
  } else if (networkID == 7777777) {
    return zoraProvider;
  } else {
    throw new Error('Invalid network');
  }
};

const getMaxLookBackBlocks = (chainID) => {
  if (chainID == 1) {
    return 10;
  } else if (chainID == 10 || chainID == 137 || chainID == 8453 || chainID == 7777777) {
    return 40;
  }
};

const getOffsetBlocksFromTip = (chainID) => {
  if (chainID == 1) {
    return 2;
  } else if (chainID == 10 || chainID == 137 || chainID == 8453 || chainID == 7777777) {
    return 10;
  }
};

const getContract = (address, provider) => {
  return new ethers.Contract(address, abi, provider);
};

const getAddressFallback = address => `${address.substr(0, 6)}...${address.substr(-4)}`;

const recoverSigner = (message, signature) => {
  return ethers.utils.verifyMessage(message, signature);
};

const verifyUserIsOwner = async (contractAddress, networkID, userAddress) => {
  const provider = getProvider(networkID);
  const contract = getContract(contractAddress, provider);
  const balance = await contract.balanceOf(userAddress);
  if (balance == 0) {
    throw new Error('Unable to verify ownership');
  }
};

const getENS = async (address) => {
  const provider = getProvider(1);
  const name = await provider.lookupAddress(address);
  return name;
};

const getEthTransaction = async (txid) => {
  const provider = getProvider(1);
  const txn = await provider.getTransaction(txid);
  return txn;
};

const recast = async (hash) => {
  await client.recast(hash);
};

const transferEvents = new ethers.utils.Interface([
  'event Transfer(address indexed _from, address indexed _to, uint256 _tokenId)',
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)'
]);

// ERC20 & ERC721 (721 has last topic indexed, but signature is the same)
const ERC20_721 = transferEvents.getEventTopic('Transfer(address indexed, address indexed, uint256 indexed)');

const getMints = async (chainID, lastBlock) => {
  const provider = getProvider(chainID);
  const maxLookBackBlocks = getMaxLookBackBlocks(chainID);
  const offsetBlocksFromTip = getOffsetBlocksFromTip(chainID);
  const endBlock = await provider.getBlockNumber() - offsetBlocksFromTip;
  const startBlock = Math.max(endBlock - maxLookBackBlocks + 1, lastBlock + 1);
  if (startBlock > endBlock) {
    return [];
  }

  const logs = await provider.getLogs({
    topics: [
      [
        ERC20_721,
      ],
      null,
      null,
      null // The presence of this last topic (as null) filters out erc20 events in some geth versions
    ],
    fromBlock: startBlock,
    toBlock: endBlock
  });
  const tokens = [];
  const txnMap = {};
  logs.filter(l => {
    if (
      l.topics[0] == ERC20_721 &&
      l.topics.length == 4 &&
      `0x${l.topics[1].slice(-40)}` == '0x0000000000000000000000000000000000000000'
    ) {
      if (!txnMap[l.transactionHash]) {
        txnMap[l.transactionHash] = { numTokens: 1, valueGwei: 0 };
      } else {
        txnMap[l.transactionHash].numTokens++;
      }
      return true;
    }
    return false;
  }).forEach(l => {
    tokens.push({
      txnID: l.transactionHash,
      contract: l.address.toLowerCase(),
      recipient: `0x${l.topics[2].slice(-40).toLowerCase()}`,
      tokenID: ethers.BigNumber.from(l.topics[3]).toString(),
      blockNum: l.blockNumber,
      tokenURI: null,
    });
  });



  await Promise.all(Object.keys(txnMap).map(async (txnID) => {
    const txn = await provider.getTransaction(txnID);
    const txnValue = parseInt(txn.value.toString().slice(0, -9) || 0);
    txnMap[txnID].valueGwei = Math.floor(txnValue / txnMap[txnID].numTokens);
    txnMap[txnID].sender = txn.from.toLowerCase();
  }));

  tokens.forEach(t => {
    t.valueGwei = txnMap[t.txnID].valueGwei;
    t.isEOA = txnMap[t.txnID].sender == t.recipient;
    t.score = 0;
  });

  const mints = tokens.filter(t => t.valueGwei > 0 && t.isEOA);

  console.log(`CHAIN: ${chainID}\tMINTS: ${mints.length}\tSKIPPED: ${tokens.length - mints.length}\tBLOCKS: ${1 + endBlock - startBlock}`);

  return mints;
}

const getCheckins = async (lastBlock) => {
  const chainID = 137;
  const provider = getProvider(chainID);
  const maxLookBackBlocks = 100; //getMaxLookBackBlocks(chainID);
  const offsetBlocksFromTip = getOffsetBlocksFromTip(chainID);
  const endBlock = await provider.getBlockNumber() - offsetBlocksFromTip;
  // const endBlock = 50314560;
  const startBlock = Math.max(endBlock - maxLookBackBlocks + 1, lastBlock + 1);
  if (startBlock > endBlock) {
    return [];
  }
  const contract = new ethers.Contract(contractSP, abiSP, provider);
  const logs = await contract.queryFilter('Checkin', startBlock, endBlock);
  console.log(`CHECKINS: ${logs.length}\tSTART: ${startBlock}\tEND: ${endBlock}\tBLOCKS: ${endBlock - startBlock}`);
  return logs.map(l => {
    let coins = null;
    try {
      coins = parseInt(ethers.utils.formatEther(l.args.coins.toString()));
    } catch (e) {
      console.log(e);
    }
    return {
      address: l.args.user,
      epoch: l.args.epoch.toNumber(),
      streak: l.args.streak.toNumber(),
      points: l.args.points.toNumber(),
      coins: coins,
      txid: l.transactionHash,
    }
  });
}


const getTokenURI = async (chainID, contractAddress, tokenID) => {
  try {
    const provider = getProvider(chainID);
    const contract = getContract(contractAddress, provider);
    const tokenURI = await contract.tokenURI(tokenID);
    if (tokenURI.length > 0 && tokenURI.length < 65_536) {
      return tokenURI;
    }
    return null;
  } catch (e) {
    return null;
  }
};

const getCollections = async (chainID, addresses) => {
  const provider = getProvider(chainID);
  const collections = await Promise.all(addresses.map(async (address) => {
    const contract = getContract(address, provider);
    try {
      const name = await contract.name();
      return {
        contract: address,
        name,
      }
    } catch (e) {
      return null;
    }
  }));
  return collections.filter(c => c != null);
}

const verifyCheckin = async (address) => {
  const contract = new ethers.Contract(contractSP, abiSP, getProvider(137));
  const currentEpoch = await contract.getCurrentEpoch();
  const message = ethers.utils.defaultAbiCoder.encode(
    [
      "uint256",
      "address",
    ],
    [
      currentEpoch,
      address
    ]
  );
  const messageHash = ethers.utils.keccak256(message);
  const signature = await walletSP.signMessage(ethers.utils.arrayify(messageHash));
  return signature;
}

const spSign = (message) => walletSP.signMessage(message);

const getSPMined = async (txid) => {
  const provider = getProvider(137);
  const txn = await provider.getTransactionReceipt(txid);
  if (txn.logs) {
    const coinsTransferred = txn.logs
      .filter(l => l.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef')
      .map(l => {
        const coins = ethers.BigNumber.from(l.data).toString();
        return parseInt(ethers.utils.formatEther(coins));
      });
    if (coinsTransferred.length > 0) {
      return coinsTransferred[0];
    } else {
      return 0;
    }
  }
  return null;
}

module.exports = {
  recoverSigner,
  verifyUserIsOwner,
  getENS,
  getEthTransaction,
  getMints,
  getTokenURI,
  getCollections,
  recast,
  verifyCheckin,
  getCheckins,
  spSign,
  getSPMined,
};
