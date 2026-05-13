import { composePlugins, withNx } from '@nx/next';

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  output: 'standalone',
  nx: {},
};

export default composePlugins(withNx)(nextConfig);
