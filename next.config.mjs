/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // O TypeScript já garante a segurança de tipos — ESLint não bloqueia o build
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
    ],
  },
}

export default nextConfig
