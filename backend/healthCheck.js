const axios = require('axios');
const API_BASE_URL = 'https://crack-celerity-419510.uc.r.appspot.com/api'; // Your backend URL

const healthCheck = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log(response.data);
  } catch (error) {
    console.error('Error during health check:', error);
  }
};

healthCheck();
