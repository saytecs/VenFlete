import type { NextConfig } from "next";
import path from 'path'

const nextConfig: NextConfig = {
  // Explicitly set Turbopack workspace root to avoid root inference warnings
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
