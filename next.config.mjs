import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
    webpack: (config) => {
        // Map '@' to project root so imports like '@/assets/...' resolve correctly
        config.resolve ||= {};
        config.resolve.alias ||= {};
        config.resolve.alias['@'] = path.resolve(process.cwd());
        return config;
    },
};

export default nextConfig;