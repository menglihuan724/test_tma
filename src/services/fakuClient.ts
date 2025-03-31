import { getFakuClient } from './clientManager';

export const testNet = async () => {
  const fakuClient = getFakuClient();
  const response = await fakuClient.get('/startBot');
  return response.data;
};

export const fakuOnce = async (num: string, isLp: string, level: string) => {
  const fakuClient = getFakuClient();
  const response = await fakuClient.post(`/fakuOnce/${num}/${isLp}/${level}`);
  return response.data;
};

export const getFakuStatus = async () => {
  const fakuClient = getFakuClient();
  const response = await fakuClient.get('/getFakuStatus');
  return response.data;
};

export const fakuGetOld = async (lpAddress: string, num: string) => {
  const fakuClient = getFakuClient();
  const response = await fakuClient.post(`/fakuGetOld?lp=${lpAddress}&num=${num}`);
  return response.data;
};

export const startAiJob = async () => {
  const fakuClient = getFakuClient();
  const response = await fakuClient.post('/startAiJob');
  return response.data;
};

export const stopAiJob = async () => {
  const fakuClient = getFakuClient();
  const response = await fakuClient.post('/stopAiJob');
  return response.data;
};

export const getAiStatus = async () => {
  const fakuClient = getFakuClient();
  const response = await fakuClient.get('/getAiStatus');
  return response.data;
}; 