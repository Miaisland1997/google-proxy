import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 自定义的sk-密钥白名单 - 你可以修改这些密钥
const validSkKeys = new Set([
  'sk-gemini-proxy-12345',
  'sk-vercel-gemini-67890',
  'sk-my-custom-key-2024'
]);

export default async function handler(request, response) {
  // 设置CORS头
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  // 健康检查端点
  if (request.method === 'GET' && request.url === '/api/gemini') {
    return response.status(200).json({
      status: 'active',
      service: 'Gemini Proxy',
      message: 'Service is running. Use POST method for API calls.',
      valid_key_example: 'sk-gemini-proxy-12345',
      usage: 'Send POST request with Authorization: Bearer sk-xxx'
    });
  }
  
  try {
    // 验证请求方法
    if (request.method !== 'POST') {
      return response.status(405).json({
        error: 'Method not allowed',
        message: 'Only POST requests are supported for API calls'
      });
    }
    
    // 验证Authorization头
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return response.status(401).json({
        error: 'Missing Authorization header',
        message: 'Please include: Authorization: Bearer sk-your-key-here'
      });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      return response.status(401).json({
        error: 'Invalid Authorization format',
        message: 'Must be: Bearer sk-xxx'
      });
    }
    
    const clientSkKey = authHeader.replace('Bearer ', '');
    
    // 验证sk-密钥
    if (!validSkKeys.has(clientSkKey)) {
      return response.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid',
        valid_keys: Array.from(validSkKeys),
        hint: 'Use one of the keys from valid_keys array'
      });
    }
    
    // 检查环境变量
    if (!GEMINI_API_KEY) {
      return response.status(500).json({
        error: 'Server configuration error',
        message: 'Gemini API key is not configured on the server'
      });
    }
    
    // 解析请求体
    let requestBody;
    try {
      requestBody = request.body;
    } catch (parseError) {
      return response.status(400).json({
        error: 'Invalid JSON body',
        message: 'Request body must be valid JSON'
      });
    }
    
    const { messages, model, stream, max_tokens, temperature } = requestBody;
    
    // 验证必需字段
    if (!messages || !Array.isArray(messages)) {
      return response.status(400).json({
        error: 'Missing required field',
        message: 'The "messages" array is required'
      });
    }
    
    // 构建Gemini请求格式
    const geminiContents = messages.map(msg => {
      // 转换角色名称
      let role = 'user';
      if (msg.role === 'assistant' || msg.role === 'system') {
        role = 'model';
      }
      
      return {
        parts: [{ text: msg.content || '' }],
        role: role
      };
    });
    
    const geminiData = {
      contents: geminiContents,
      generationConfig: {
        temperature: temperature || 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: max_tokens || 1024,
      }
    };
    
    // 调用Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    const geminiResponse = await axios.post(geminiUrl, geminiData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000
    });
    
    // 处理Gemini响应
    if (!geminiResponse.data.candidates || !geminiResponse.data.candidates[0]) {
      throw new Error('No response from Gemini API');
    }
    
    const geminiText = geminiResponse.data.candidates[0].content.parts[0].text;
    
    // 构建OpenAI兼容的响应格式
    const openAIResponse = {
      id: "chatcmpl-" + Math.random().toString(36).substring(2),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: model || "gemini-pro",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: geminiText
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
    
    // 返回成功响应
    response.status(200).json(openAIResponse);
    
  } catch (error) {
    console.error('Gemini Proxy Error:', error.message);
    
    // 更详细的错误处理
    if (error.response) {
      // Gemini API返回的错误
      response.status(error.response.status).json({
        error: 'Gemini API error',
        message: error.message,
        details: error.response.data
      });
    } else if (error.request) {
      // 网络错误
      response.status(503).json({
        error: 'Network error',
        message: 'Cannot connect to Gemini API'
      });
    } else {
      // 其他错误
      response.status(500).json({
        error: 'Proxy error',
        message: error.message
      });
    }
  }
}
