export const AppConfig = {
  metadata: {
    title: 'Your App Name',
    description: 'A brief description of your app',
    keywords: ['nextjs', 'react', 'web development'],
    authors: [{ name: 'Your Name', url: 'https://yourwebsite.com' }],
    creator: 'Your Name',
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: 'white' },
      { media: '(prefers-color-scheme: dark)', color: 'black' },
    ],
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://yourwebsite.com',
      site_name: 'Your App Name',
    },
    twitter: {
      handle: '@yourtwitterhandle',
      site: '@yoursite',
      cardType: 'summary_large_image',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { follow: true, index: true }
    }
  },
};
