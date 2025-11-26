import axios from 'axios';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export default async function handler(request, response) {
  // 设置CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  try {
    const url = new URL(request.url, `https://${request.headers.host}`);
    const address = url.searchParams.get('address') || '北京';
    
    console.log('Processing address:', address);
    
    if (!GOOGLE_API_KEY) {
      console.error('Google API key missing');
      return response.status(500).json({ 
        error: 'API key not configured',
        details: 'Check Vercel environment variables' 
      });
    }
    
    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
    console.log('Calling Google API:', googleUrl);
    
    const googleResponse = await axios.get(googleUrl, { 
      timeout: 10000,
