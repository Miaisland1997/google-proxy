import axios from 'axios';

// 你的真实Gemini API密钥 - 在Vercel环境变量中设置
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContents';

export default async function handler(request, response) {
  // 设置CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  try {
    // 验证客户端提供的sk密钥（简单演示）
    const clientKey = request.headers.authorization?.replace('Bearer ', '');
    const validKeys = ['sk-vercel-proxy-1234567890abcdef', 'sk-gemini-proxy'];
    
    if (!clientKey || !validKeys.includes(clientKey)) {
      return response.status(401).json({
        error: 'Invalid API key',
        message: 'Please use a valid sk- key from /api/sk-key'
      });
    }
    
    if (!GEMINI_API_KEY) {
      return response.status(500).json({ 
        error: 'Server configuration error',
        message: 'Gemini API key not configured' 
      });
    }
    
    // 转发到真实的Gemini API
    const geminiUrl = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
    
    const geminiResponse = await axios.post(geminiUrl, request.body, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000
    });
    
    response.json(geminiResponse.data);
    
  } catch (error) {
    console.error('Gemini Proxy Error:', error.message);
    response.status(500).json({ 
      error: 'Proxy failed', 
      message: error.message,
      details: error.response?.data 
    });
  }
}
