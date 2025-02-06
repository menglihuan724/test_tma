import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const fakuClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Authorization": `Basic ${btoa(`${import.meta.env.VITE_AUTH_USER}:${import.meta.env.VITE_AUTH_TOKEN}`)}`,
    // 'Content-Type': 'application/json',
  },
});

export const testNet = async () => {
  const response = await fakuClient.get('/startBot');
  return response.data;
};

export const fakuOnce = async (num: string, isLp: string, level: string) => {
  const response = await fakuClient.post(`/fakuOnce/${num}/${isLp}/${level}`);
  return response.data;
};

export const getFakuStatus = async () => {
  const response = await fakuClient.get('/getFakuStatus');
  return response.data;
};

export const fakuGetOld = async (lpAddress: string, num: string) => {
  const response = await fakuClient.post(`/fakuGetOld?lp=${lpAddress}&num=${num}`);
  return response.data;
};

export const startAiJob = async () => {
  const response = await fakuClient.post('/startAiJob');
  return response.data;
};

export const stopAiJob = async () => {
  const response = await fakuClient.post('/stopAiJob');
  return response.data;
};

export const getAiStatus = async () => {
  const response = await fakuClient.get('/getAiStatus');
  return response.data;
}; 