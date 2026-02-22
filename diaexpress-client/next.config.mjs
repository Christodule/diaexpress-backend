/** @type {import('next').NextConfig} */
const normaliseBaseUrl = (value = '') => value.replace(/\/+$/, '');
const isAbsoluteUrl = (value = '') => /^https?:\/\//i.test(value);

const resolveProxyTarget = () => {
  const candidate =
    process.env.NEXT_PUBLIC_DIAEXPRESS_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    process.env.API_BASE_URL ??
    '';

  if (!isAbsoluteUrl(candidate)) {
    return '';
  }

  const normalised = normaliseBaseUrl(candidate);
  return normalised ? normalised : '';
};

const backendProxyTarget = resolveProxyTarget();

const reactServerDomAliases = {
  'react-server-dom-webpack/client': 'next/dist/compiled/react-server-dom-webpack-experimental/client.browser.js',
  'react-server-dom-webpack/client.edge': 'next/dist/compiled/react-server-dom-webpack-experimental/client.edge.js',
  'react-server-dom-webpack/client.node': 'next/dist/compiled/react-server-dom-webpack-experimental/client.node.js',
  'react-server-dom-webpack/server': 'next/dist/compiled/react-server-dom-webpack-experimental/server.browser.js',
  'react-server-dom-webpack/server.edge': 'next/dist/compiled/react-server-dom-webpack-experimental/server.edge.js',
  'react-server-dom-webpack/server.node': 'next/dist/compiled/react-server-dom-webpack-experimental/server.node.js',
};

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@diaexpress/shared'],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      ...reactServerDomAliases,
    };
    config.resolve.symlinks = false;
    return config;
  },
  async rewrites() {
    if (!backendProxyTarget) {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${backendProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
