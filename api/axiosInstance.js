import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://your-api-server.com', // baseURL 설정
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;
