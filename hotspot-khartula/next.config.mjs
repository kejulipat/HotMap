/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "16mb",
    },
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default nextConfig;
