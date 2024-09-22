const withMDX = require('@next/mdx')({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['mdx', 'ts', 'tsx'],
  experimental: {
    mdxRs: true,
  },
};

module.exports = withMDX(nextConfig);
