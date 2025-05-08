import axios from 'axios';

export default axios.create({
  baseURL: '/api/wallets',
  headers: {
    'Content-Type': 'application/json'
  }
});
