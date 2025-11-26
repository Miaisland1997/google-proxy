export default async function handler(request, response) {
  console.log('Health check called');
  return response.status(200).json({ 
    status: 'OK', 
    message: 'Google Proxy is working!',
    path: request.url
  });
}
