const { createContentlayerPlugin } = require("next-contentlayer");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

const withContentlayer = createContentlayerPlugin();

module.exports = withContentlayer(nextConfig);