const ethers = require('ethers');
const abi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"balance","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"operator","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"owner","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"_approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}];


const etherProvider = new ethers.providers.AlchemyProvider(1, process.env.ALCHEMY_ETHEREUM_KEY);
const maticProvider = new ethers.providers.AlchemyProvider(137, process.env.ALCHEMY_POLYGON_KEY);

const getProvider = networkID => {
  if (networkID == 1) {
    return etherProvider;
  } else if (networkID == 137) {
    return maticProvider;
  } else {
    throw new Error('Invalid network');
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

const transferEvents = new ethers.utils.Interface([
  'event Transfer(address indexed _from, address indexed _to, uint256 _tokenId)',
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)'
]);

// ERC20 & ERC721 (721 has last topic indexed, but signature is the same)
const ERC20_721 = transferEvents.getEventTopic('Transfer(address indexed, address indexed, uint256 indexed)');

const getMints = async (chainID, lastBlock) => {
  const provider = getProvider(chainID);
  const maxLookBackBlocks = chainID == 1 ? 10 : 50;
  const offsetBlocksFromTip = chainID == 1 ? 1 : 5;
  const endBlock = await provider.getBlockNumber() - offsetBlocksFromTip;
  const startBlock = Math.max(endBlock - maxLookBackBlocks, lastBlock + 1);
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
  logs.forEach(l => {
    const sig = l.topics[0];
    if (sig == ERC20_721 && l.topics.length == 4) {
      if (
        `0x${l.topics[1].slice(-40)}` == '0x0000000000000000000000000000000000000000'
      ) {
        tokens.push({
          contract: l.address.toLowerCase(),
          recipient: `0x${l.topics[2].slice(-40).toLowerCase()}`,
          tokenID: ethers.BigNumber.from(l.topics[3]).toString(),
          blockNum: l.blockNumber,
          tokenURI: null,
        });
      }
    }
  });

  const mints = tokens;
  // const mints = (await Promise.all(tokens.map(async (token) => {
  //   try {
  //     const contract = getContract(token.contract, provider);
  //     const tokenURI = await contract.tokenURI(token.tokenID);
  //     if (tokenURI.length > 0 && tokenURI.length < 65_536) {
  //       token.tokenURI = tokenURI;
  //     }
  //     return token;
  //   } catch (e) {
  //     return null;
  //   }
  // }))).filter(m => m !== null);

  console.log(`CHAIN: ${chainID}\tMINTS: ${mints.length}\tSKIPPED: ${tokens.length - mints.length}\tBLOCKS: ${1 + endBlock - startBlock}`);

  return mints;
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

module.exports = {
  recoverSigner,
  verifyUserIsOwner,
  getENS,
  getMints,
  getTokenURI,
  getCollections,
};
