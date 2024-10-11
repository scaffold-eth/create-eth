import { withDefaults } from '../../../utils.js'

const contents = ({ ignoreTsAndLintBuildErrors, extraConfig }) =>
`// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  ${extraConfig[0]
    ? `${Object.entries(extraConfig[0])
        .map(([key, value]) => `${key}: ${JSON.stringify(value)},`)
        .join('\n  ')}`
    : ''}
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: ${ignoreTsAndLintBuildErrors},
  },
  eslint: {
    ignoreDuringBuilds: ${ignoreTsAndLintBuildErrors},
  },
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

module.exports = nextConfig;
`

export default withDefaults(contents, {
  ignoreTsAndLintBuildErrors: 'process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true"',
  extraConfig: ''
})
