/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    config.externals.push(
      "@coinbase/wallet-sdk",
      "@metamask/connect-evm",
      "porto/internal",
      "porto",
      "pino-pretty",
      "lokijs",
      "encoding"
    );
    return config;
  },
};
module.exports = nextConfig;
