import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    register: false,
    disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            allowedOrigins: ['localhost:3001', '*.trycloudflare.com'],
            bodySizeLimit: '10mb',
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
            {
                protocol: 'http',
                hostname: '127.0.0.1', // for local supabase testing
            }
        ]
    }
};

export default withSerwist(nextConfig);
