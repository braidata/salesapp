// regenerate-token.js
// Script para regenerar el refresh token de Google Ads

const { google } = require('googleapis');
const readline = require('readline');

// Configuración OAuth
const CLIENT_ID = 'tu-client-id';
const CLIENT_SECRET = 'tu-client-secret';
const REDIRECT_URI = 'http://localhost:3000/oauth/callback'; // o tu URI configurada

// Scopes necesarios para Google Ads
const SCOPES = ['https://www.googleapis.com/auth/adwords'];

async function generateNewRefreshToken() {
  // Crear cliente OAuth2
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  // Generar URL de autorización
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Importante para obtener refresh token
    scope: SCOPES,
    prompt: 'consent' // Fuerza a mostrar pantalla de consentimiento
  });

  console.log('1. Abre esta URL en tu navegador:');
  console.log(authUrl);
  console.log('\n2. Completa el proceso de autorización');
  console.log('3. Copia el código de autorización de la URL de retorno\n');

  // Leer código de autorización
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Ingresa el código de autorización: ', async (code) => {
      try {
        // Intercambiar código por tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        console.log('\n✅ Tokens generados exitosamente:');
        console.log('Access Token:', tokens.access_token);
        console.log('Refresh Token:', tokens.refresh_token);
        console.log('\n🔄 Actualiza tu variable de entorno GOOGLE_ADS_REFRESH_TOKEN_VENTUS con:');
        console.log(tokens.refresh_token);
        
        rl.close();
        resolve(tokens);
      } catch (error) {
        console.error('❌ Error al obtener tokens:', error);
        rl.close();
        reject(error);
      }
    });
  });
}

// Ejecutar script
generateNewRefreshToken()
  .then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

// Para ejecutar este script:
// 1. npm install googleapis
// 2. Actualiza CLIENT_ID y CLIENT_SECRET con tus valores
// 3. node regenerate-token.js