export default async function handler(request, response) {
  console.log('Google API called');
  
  // 设置CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  try {
    // 先返回一个简单的成功响应，测试基础功能
    return response.status(200).json({
      success: true,
      message: 'Google proxy is working',
      test: 'This is a test response',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({ 
      error: 'Simple proxy failed',
      message: error.message 
    });
  }
}
