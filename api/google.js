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
    const { searchParams } = new URL(request.url, `https://${request.headers.host}`);
    const address = searchParams.get('address') || '北京';
    
    if (!GOOGLE_API_KEY) {
      return response.status(500).json({ error: 'Google API key not configured' });
    }
    
    // 直接使用地理编码API
    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
    
    const googleResponse = await axios.get(googleUrl, { timeout: 10000 });
    response.json(googleResponse.data);
    
  } catch (error) {
    response.status(500).json({ 
      error: 'Proxy failed', 
      message: error.message 
    });
  }
}
