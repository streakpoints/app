import axios from 'axios';
import { stringify } from 'qs';

axios.defaults.withCredentials = true;

const BASE_URL = window.location.href.indexOf('http://localhost:') === 0 ? 'http://localhost:8000/-/api' : '/-/api';

export const login = () => window.location.href = `${BASE_URL}/auth/twitter/init`;

export const logout = async () => {
  await axios.get(`${BASE_URL}/auth/logout`);
  window.location.reload();
}

export const getUser = async () => {
  const response = await axios.get(`${BASE_URL}/auth/user`);
  return response.data.results;
}

export const getRules = async params => {
  const response = await axios.get(`${BASE_URL}/twitter-account/rule`, { params });
  return response.data.results;
}

export const archive = async params => {
  const response = await axios.post(`${BASE_URL}/tweet-token/uri`, params);
  return response.data.results;
}

export const tweet = async params => {
  const response = await axios.post(`${BASE_URL}/tweet-token`, params);
  return response.data.results;
}

export const save = async params => {
  const response = await axios.post(`${BASE_URL}/twitter-account/rule`, params);
  return response;
}

export const searchUser = async (params) => {
  const response = await axios.get(`${BASE_URL}/twitter-account`, { params });
  return response.data.results;
}

export const getCollectionsOpensea = async signerAddress => {
  const response = await axios.get('https://api.opensea.io/api/v1/collections', {
    params: {
      asset_owner: signerAddress,
      limit: 300
    }
  });
  return response.data;
};

export const getAssetsOpensea = async (ownerAddress, contractAddresses) => {
  const response = await axios.get('https://api.opensea.io/api/v1/assets', {
    params: {
      owner: ownerAddress,
      asset_contract_addresses: contractAddresses,
      limit: 50
    },
    paramsSerializer: (params) => {
      return stringify(params, { arrayFormat: 'repeat' })
    }
  });
  return response.data.assets;
}
