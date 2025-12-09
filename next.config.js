/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For Docker/Cloud Run deployment
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
  },
  // Enable static exports if needed
  // trailingSlash: true,
}

module.exports = nextConfig
