const ethers = require('ethers');
const abi = require('./721-abi.json');

const networkID = 1;
const infuraAccessToken = 'e8e7334c5daa415489ab1df636995565';
const TOKENS = {
    CryptoPunks: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
    BoredApes: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    Zorb: '0xca21d4228cdcc68d4e23807e5e370c07577dd152'
};

function getProvider() {
    return new ethers.providers.InfuraProvider(networkID, infuraAccessToken);
}

function getContract(address, provider) {
    return new ethers.Contract(address, abi, provider);
}

module.exports = async function(tokenID, message, signer, signature) {
    const provider = getProvider();
    const recoveredSigner = ethers.utils.verifyMessage(message, signature);
    if (recoveredSigner != signer) {
        throw new Error('invalid signature');
    }
    const zContract = getContract(TOKENS.Zorb, provider);
    const owner = await zContract.ownerOf(tokenID);
    if (owner != signer) {
        throw new Error('not owner');
    }
    return true;
};

