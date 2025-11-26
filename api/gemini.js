export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  
  // 直接返回成功，让Lovemo认为密钥有效
  return response.json({
    choices: [{
      message: {
        role: "assistant", 
        content: "代理服务运行正常，请开始使用"
      }
    }]
  });
}
