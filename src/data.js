import axios from 'axios';
import { stringify } from 'qs';

// axios.defaults.withCredentials = true;

const BASE_URL = window.location.href.indexOf('http://localhost:') === 0 ? 'http://localhost:8000/-/api' : '/-/api';

export const getFeed = async params => {
  const response = await axios.get(`${BASE_URL}/feed`, { params });
  return response.data.results;
}

export const getRecentTokens = async () => {
  const response = await axios.get(`${BASE_URL}/tokens/recent`);
  return response.data.results;
}

export const getCollectionOwners = async params => {
  const response = await axios.get(`${BASE_URL}/collection-owners`, { params });
  return response.data.results;
}

export const getTokens = async params => {
  const response = await axios.get(`${BASE_URL}/tokens`, { params });
  return response.data.results;
}

export const getAccountTokens = async params => {
  const response = await axios.get(`${BASE_URL}/user-tokens`, { params });
  return response.data.results;
}

export const getCollection = async params => {
  const response = await axios.get(`${BASE_URL}/collection`, { params });
  return response.data.results;
}

export const getENS = async params => {
  const response = await axios.get(`${BASE_URL}/ens`, { params });
  return response.data.results;
}

export const getTopCollectors = async params => {
  const response = await axios.get(`${BASE_URL}/top-collectors`, { params });
  return response.data.results;
}

export const getOverlap = async params => {
  const response = await axios.get(`${BASE_URL}/overlap`, { params });
  return response.data.results;
}

export const getUserGraph = async params => {
  const response = await axios.get(`${BASE_URL}/user-graph`, { params });
  return response.data.results;
}

export const checkCast = async params => {
  const response = await axios.post(`${BASE_URL}/check-cast`, params);
  return response.data.results;
}

export const recast = async params => {
  const response = await axios.post(`${BASE_URL}/recast`, params);
  return response.data.results;
}

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
