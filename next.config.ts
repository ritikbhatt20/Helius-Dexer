/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ["knex", "pg"], // Mark knex and pg as server-only
};

module.exports = nextConfig;
