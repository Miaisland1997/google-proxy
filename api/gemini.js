import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 你自定义的sk-密钥白名单
const validSkKeys = new Set([
  'sk-gemini-proxy-12345',
  'sk-vercel-gemini-67890',
  'sk-my-gemini-proxy'
]);

export default async function handler(request, response) {
  // 设置CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  try {
    // 1. 验证sk-格式密钥
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ 
        error: 'Missing API key',
        hint: 'Use Authorization: Bearer sk-xxx in header' 
      });
    }
    
    const clientSkKey = authHeader.replace('Bearer ', '');
    if (!validSkKeys.has(clientSkKey)) {
      return response.status(401).json({ 
        error: 'Invalid API key',
        valid_keys: Array.from(validSkKeys) 
      });
    }
    
    // 2. 获取请求数据
    const { messages, model, stream } = request.body;
    
    console.log('Received request:', { messages, model });
    
    if (!GEMINI_API_KEY) {
      return response.status(500).json({ 
        error: 'Server misconfiguration',
        message: 'Gemini API key not set in environment variables' 
      });
    }
    
    // 3. 将OpenAI格式转换为Gemini格式
    const geminiData = {
      contents: messages.map(msg => ({
        parts: [{ text: msg.content }],
        role: msg.role === 'user' ? 'user' : 'model'
      })),
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };
    
    // 4. 调用真实的Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log('Calling Gemini API...');
    const geminiResponse = await axios.post(geminiUrl, geminiData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    // 5. 将Gemini响应转换回OpenAI格式
    const geminiText = geminiResponse.data.candidates[0].content.parts[0].text;
    
    const openAIFormatResponse = {
      id: "gemini-" + Date.now(),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "gemini-pro",
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: geminiText
        },
        finish_reason: "stop"
      }],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
    
    console.log('Successfully proxied request');
    response.json(openAIFormatResponse);
    
  } catch (error) {
    console.error('Proxy error:', error.message);
    console.error('Error details:', error.response?.data);
    
    response.status(500).json({ 
      error: 'Proxy failed', 
      message: error.message,
      details: error.response?.data 
    });
  }
}
