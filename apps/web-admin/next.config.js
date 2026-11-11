/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
  async redirects() {
    return [
      {
        source: '/academics/classes',
        destination: '/classes',
        permanent: false,
      },
      {
        source: '/cycles',
        destination: '/classes',
        permanent: false,
      },
      {
        source: '/grades',
        destination: '/academics/grades',
        permanent: false,
      },
      {
        source: '/report-cards',
        destination: '/academics/report-cards',
        permanent: false,
      },
      {
        source: '/bulletins',
        destination: '/academics/report-cards',
        permanent: false,
      },
      {
        source: '/deliberations',
        destination: '/academics/deliberations',
        permanent: false,
      },
      {
        source: '/reports',
        destination: '/academics/reports',
        permanent: false,
      },
      {
        source: '/caisse',
        destination: '/cashier',
        permanent: false,
      },
      {
        source: '/recouvrement',
        destination: '/finance/reports',
        permanent: false,
      },
      {
        source: '/eleves',
        destination: '/students',
        permanent: false,
      },
      {
        source: '/presences',
        destination: '/attendance',
        permanent: false,
      },
      {
        source: '/edt',
        destination: '/timetable',
        permanent: false,
      },
      {
        source: '/parametres',
        destination: '/settings',
        permanent: false,
      },
      {
        source: '/config',
        destination: '/settings',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
