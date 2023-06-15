import axios from 'axios';
import { stringify } from 'qs';

axios.defaults.withCredentials = true;

const BASE_URL = window.location.href.indexOf('http://localhost:') === 0 ? 'http://localhost:8000/-/api' : '/-/api';

export const getFeed = async params => {
  const response = await axios.get(`${BASE_URL}/feed`, { params });
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
