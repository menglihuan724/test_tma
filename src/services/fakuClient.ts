import axios from 'axios';
import env from '../config/env';

const fakuClient = axios.create({
  baseURL: env.VITE_BASE_URL,
  headers: {
    Authorization: `Basic ${btoa(`${env.VITE_AUTH_USER}:${env.VITE_AUTH_TOKEN}`)}`,
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