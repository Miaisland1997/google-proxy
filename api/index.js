export default async function handler(request, response) {
  return response.json({ 
    status: 'OK', 
    message: 'Google Proxy is running!',
    timestamp: new Date().toISOString()
  });
}
