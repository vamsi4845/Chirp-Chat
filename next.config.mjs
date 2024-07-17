/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [
            "res.cloudinary.com",
            "avatars.githubusercontent.com",
            "lh3.googleusercontent.com"
        ]
    },
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['bcrypt'],
  },
};

export default nextConfig;