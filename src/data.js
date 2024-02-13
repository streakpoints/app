import axios from 'axios';

axios.defaults.withCredentials = true;

const BASE_URL = window.location.href.indexOf('http://localhost:') === 0 ? 'http://localhost:8000/-/api' : '/-/api';

export const getENS = async params => {
  const response = await axios.get(`${BASE_URL}/ens`, { params });
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

export const getTopStreaks = async params => {
  const response = await axios.get(`${BASE_URL}/top-streaks`, { params });
  return response.data.results;
}

export const getTopPoints = async params => {
  const response = await axios.get(`${BASE_URL}/top-points`, { params });
  return response.data.results;
}

export const getEpochStats = async params => {
  const response = await axios.get(`${BASE_URL}/epoch-stats`, { params });
  return response.data.results;
}

export const getLastCheckin = async params => {
  const response = await axios.get(`${BASE_URL}/last-checkin`, { params });
  return response.data.results;
}

export const getProfile = async params => {
  const response = await axios.get(`${BASE_URL}/profile`, { params });
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
