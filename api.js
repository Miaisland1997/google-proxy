import axios from 'axios';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  try {
    const url = new URL(request.url, `https://${request.headers.host}`);
    const pathname = url.pathname;
    
    let apiPath = pathname.replace(/^\/api/, '');
    if (apiPath.startsWith('/')) {
      apiPath = apiPath.substring(1);
    }
    
    if (!apiPath) {
      return response.status(200).json({ 
        status: 'OK', 
        message: 'Google Proxy is running'
      });
    }
    
    let googleUrl = `https://maps.googleapis.com/${apiPath}`;
    
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(request.query)) {
      if (value) {
        searchParams.append(key, value);
      }
    }
    
    if (GOOGLE_API_KEY) {
      searchParams.append('key', GOOGLE_API_KEY);
    } else {
      return response.status(500).json({ 
        error: 'Google API key not configured' 
      });
    }
    
    const queryString = searchParams.toString();
    if (queryString) {
      googleUrl += googleUrl.includes('?') ? `&${queryString}` : `?${queryString}`;
    }
    
    const googleResponse = await axios({
      method: request.method,
      url: googleUrl,
      data: request.body,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });
    
    response.status(googleResponse.status).json(googleResponse.data);
    
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    if (error.response) {
      response.status(error.response.status).json({
        error: 'Google API error',
        message: error.message
      });
    } else {
      response.status(500).json({
        error: 'Proxy error',
        message: error.message
      });
    }
  }
}