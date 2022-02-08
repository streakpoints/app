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


(async () => {
    const provider = getProvider();
    // const baContract = getContract(TOKENS.BoredApes, provider);
    // const BAOwner = await baContract.ownerOf(1);
    // console.log(BAOwner);

    // const cpContract = getContract(TOKENS.CryptoPunks, provider);
    // const CPOwner = await cpContract.punkIndexToAddress(1);
    // console.log(CPOwner);


    const zContract = getContract(TOKENS.Zorb, provider);
    const zOwnerA = await zContract.ownerOf('25371');
    const zOwnerB = await zContract.ownerOf('3466');
    console.log(zOwnerA, zOwnerB);
})();

