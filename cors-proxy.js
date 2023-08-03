const cors_proxy = require('cors-anywhere');

const host = 'localhost'; // Si deseas que solo funcione en localhost, cámbialo a 'localhost'
const port = 8080; // Puedes usar cualquier puerto que no esté en uso

cors_proxy.createServer({
  originWhitelist: [], // Lista blanca vacía permite cualquier origen. Puedes especificar los dominios permitidos aquí
  requireHeader: ['origin', 'x-requested-with'],
  removeHeaders: ['cookie', 'cookie2'],
}).listen(port, host, () => {
  console.log(`Running CORS Anywhere on ${host}:${port}`);
});