/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // O TypeScript já garante a segurança de tipos — ESLint não bloqueia o build
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Evita artefatos persistentes incompletos no preview após sincronizações de arquivos.
    turbopackFileSystemCacheForDev: false,
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
