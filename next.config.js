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
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ventuscorp.cl',
        // port: '',
        // pathname: '/account123/**',
      },
    ],
  },

  webpack: (
    config, options
  ) => {
    config.module.noParse = [require.resolve("typescript/lib/typescript.js")]
    return config
  },

  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  
}
