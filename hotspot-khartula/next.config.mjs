/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    agentUpgrade: "security",
  },
};

export default nextConfig;
