/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
import CopyPlugin from 'copy-webpack-plugin';
!process.env.SKIP_ENV_VALIDATION && (await import("./src/env.mjs"));

/** @type {import("next").NextConfig} */
const config = {
  webpack: (config, { isServer }) => {
    // Only run on the client-side
    if (!isServer) {
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: './node_modules/occt-import-js/dist/occt-import-js.wasm',
              to: 'static/chunks/occt-import-js.wasm',
            },
          ],
        })
      );
    }

    return config;
  },
  reactStrictMode: true,

  /**
   * If you have the "experimental: { appDir: true }" setting enabled, then you
   * must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  images: {
    domains: [
      `${process.env.S3_UPLOAD_BUCKET}.s3.amazonaws.com`,
      `${process.env.S3_UPLOAD_BUCKET}.s3.${process.env.S3_UPLOAD_REGION}.amazonaws.com`,
      "rfq-files.s3.us-east-1.amazonaws.com",
      "lh3.googleusercontent.com",
      "s.gravatar.com",
    ],
  },
};
export default config;
