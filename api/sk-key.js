export default async function handler(request, response) {
  // 返回一个固定的sk-格式密钥
  return response.json({
    api_key: "sk-vercel-proxy-1234567890abcdef",
    status: "active",
    message: "Use this key with our proxy service",
    endpoint: "https://" + request.headers.host + "/api/gemini"
  });
}
