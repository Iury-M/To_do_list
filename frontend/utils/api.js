import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000', // backend rodando localmente
});

export default api;
