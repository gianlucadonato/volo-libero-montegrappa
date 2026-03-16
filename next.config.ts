import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "local.infinicloud.net",
    "http://local.infinicloud.net",
    "https://local.infinicloud.net",
  ],
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
