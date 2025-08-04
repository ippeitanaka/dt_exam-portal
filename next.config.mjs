/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 静的エクスポートを無効にして動的レンダリングを許可
  output: undefined,
  experimental: {
    // outputFileTracingRoot: undefined, // この設定は削除
  },
  // 環境変数が必要なページは動的レンダリングを強制
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex',
          },
        ],
      },
    ]
  },
}

export default nextConfig
