import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const app = express();
// const PORT =  3001;
const PORT = process.env.PORT || 3001;

// Create an HTTPS agent that ignores SSL certificate error
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Create axios instance with custom config
const axiosInstance = axios.create({
  httpsAgent,
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  },
  maxRedirects: 5,
  validateStatus: function (status) {
    return status >= 200 && status < 300; // Accept only 2xx status codes
  }
});

app.get('/api/attendance', async (req, res) => {
  try {
    const { sic } = req.query;
    
    if (!sic) {
      return res.status(400).json({ error: 'SIC is required' });
    }

    const uppercaseSic = sic.toUpperCase();
    console.log(`Fetching attendance for SIC: ${uppercaseSic}`);

    const apiUrl = `https://erp.silicon.ac.in/estcampus/hostel/db_hostel_attendance.php?oper=CHECK_HOSTEL_ATTENDANCE&studentId=${uppercaseSic}`;
    
    const response = await axiosInstance.get(apiUrl);
    
    console.log('Response received, status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Send the HTML response
    res.set('Content-Type', 'text/html');
    res.send(response.data);
    
  } catch (error) {
    console.error('Axios error:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      
      res.status(error.response.status).send(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      res.status(503).json({ 
        error: 'No response from ERP server',
        message: 'The ERP system is not responding'
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
      res.status(500).json({ 
        error: 'Request failed',
        message: error.message
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server running on http://localhost:${PORT}`);
  console.log(`📍 Using axios with SSL verification disabled`);
});
