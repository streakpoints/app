import axios from 'axios';
import { stringify } from 'qs';

axios.defaults.withCredentials = true;

const BASE_URL = window.location.href.indexOf('http://localhost:') === 0 ? 'http://localhost:8000/-/api' : '/-/api';

export const getFeed = async params => {
  const response = await axios.get(`${BASE_URL}/feed`, { params });
  return response.data.results;
}

export const getRecentTokens = async () => {
  const response = await axios.get(`${BASE_URL}/tokens/recent`);
  return response.data.results;
}

export const getTokens = async params => {
  const response = await axios.get(`${BASE_URL}/tokens`, { params });
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
// !_-
export const getAccount = async params => {
  const response = await axios.get(`${BASE_URL}/account`, { params });
  return response.data.results;
}

export const login = async params => {
  const response = await axios.post(`${BASE_URL}/login`, params);
  return response.data.results;
}

export const logout = async params => {
  const response = await axios.get(`${BASE_URL}/logout`, { params });
  return response.data.results;
}

export const getLoginNonce = async params => {
  const response = await axios.get(`${BASE_URL}/login-nonce`, { params });
  return response.data.results;
}

export const getCheckinVerification = async params => {
  try {
    const response = await axios.get(`${BASE_URL}/checkin/verify`, { params });
    return response.data.results;
  } catch (e) {
    throw new Error(e.response.data.errors[0]);
  }
}

export const getCheckins = async params => {
  const response = await axios.get(`${BASE_URL}/checkin`, { params });
  return response.data.results;
}

export const sendPhonePin = async params => {
  try {
    const response = await axios.post(`${BASE_URL}/account/verify-start`, params);
    return response.data.results;
  } catch (e) {
    throw new Error(e.response.data.errors[0]);
  }
}

export const confirmPhonePin = async params => {
  try {
    const response = await axios.post(`${BASE_URL}/account/verify-complete`, params);
    return response.data.results;
  } catch (e) {
    throw new Error(e.response.data.errors[0]);
  }
}
