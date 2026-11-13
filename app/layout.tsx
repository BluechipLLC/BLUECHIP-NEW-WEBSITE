import type { Metadata, Viewport } from 'next';
import { DM_Sans, Manrope } from 'next/font/google';
import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/header/SiteHeader';
import { RouteFocus } from '@/components/navigation';
import { SiteFooter } from '@/components/SiteFooter';
import { StartProjectProvider } from '@/components/start-project/StartProject';
import { defaultDescription, defaultTitle, siteName, siteUrl } from '@/content/site';
import '@/styles/style.css';
import '@/styles/header-pill.css';
import '@/styles/footer.css';
import '@/styles/start-project.css';
import '@/styles/homepage-redesign.css';
import '@/styles/page-transition.css';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-dm-sans', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-manrope', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: defaultTitle, template: '%s | Bluechip' },
  description: defaultDescription,
  applicationName: siteName,
  openGraph: { siteName, type: 'website', locale: 'en_US' },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = { themeColor: '#00529c' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Next keeps route changes instant even though in-page anchors scroll smoothly.
    <html lang="en" data-scroll-behavior="smooth" className={`${dmSans.variable} ${manrope.variable}`}>
      <body>
        <StartProjectProvider>
          <a className="skip" href="#main">Skip to content</a>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <RouteFocus />
        </StartProjectProvider>
      </body>
    </html>
  );
}
