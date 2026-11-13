/** @type {import('next').NextConfig} */
const nextConfig = {
  // Every page is pre-rendered, so the site ships as plain static files.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
