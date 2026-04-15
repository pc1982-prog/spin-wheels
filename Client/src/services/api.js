import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

export const submitSpin = (formData) =>
  api.post("/spin", formData);

export const fetchRewards = () =>
  api.get("/spin/rewards");