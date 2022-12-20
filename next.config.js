/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  env: {
    DB_DATABASE: process.env.DB_DATABASE,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_HOST: process.env.DB_HOST,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ventuscorp.cl',
        // port: '',
        // pathname: '/account123/**',
      },
    ],
  },
  
}
