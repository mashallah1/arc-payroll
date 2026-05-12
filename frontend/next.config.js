/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@reown/appkit', '@reown/appkit-adapter-wagmi', '@walletconnect/ethereum-provider'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};
module.exports = nextConfig;
