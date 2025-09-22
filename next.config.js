/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript checking during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Enable experimental optimizeCss
  experimental: {
    optimizeCss: true,
    // Disable turbopack for production builds to avoid runtime issues
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
  // Configure static file handling
  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  // Configure webpack for better handling of large files
  webpack: (config, { isServer }) => {
    // Increase the size limit for static files
    config.module.rules.push({
      test: /\.(fbx|glb|gltf)$/,
      type: "asset/resource",
      generator: {
        filename: "static/models/[name][ext]",
      },
    });

    return config;
  },
};

export default nextConfig;
