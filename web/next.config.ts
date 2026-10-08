import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Bottle photos live in the public Supabase storage bucket.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pzzbvinbyzaxrshlmlcn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
