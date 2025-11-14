import axios, { AxiosInstance } from "axios";
import { getHdConfig, HdConfig } from "./hdConfig";

export function createHdAxios(env?: string | null): { client: AxiosInstance; config: HdConfig } {
  const config = getHdConfig(env);

  const client = axios.create({
    baseURL: config.baseURL.replace(/\/$/, ""),
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  client.interceptors.request.use((request) => {
    if (!request.headers) request.headers = {};
    if (config.token) {
      request.headers.Authorization = `Bearer ${config.token}`;
    }
    return request;
  });

  return { client, config };
}
