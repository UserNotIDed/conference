import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Prisma's client resolves its generated artefacts at runtime, which the
   * bundler cannot follow. Leaving it external is the documented arrangement
   * and is what keeps the serverless function's file trace correct on Vercel,
   * a bundled client deploys fine and then fails on the first query.
   */
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-libsql",
    "@libsql/client",
  ],
};

export default nextConfig;
