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

// next/font self-hosts the same Google fonts under their real family names ("DM Sans", "Manrope"),
// which styles/style.css references directly. Its `variable`/`className` values are deliberately not
// used: they add a size-adjusted fallback face, which changes how glyphs missing from the fonts
// (arrows, symbols) render compared with the plain Arial fallback the design was built on.
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap' });
/** Family names the stylesheet relies on; the build fails loudly here if next/font ever renames them. */
for (const [font, name] of [[dmSans, 'DM Sans'], [manrope, 'Manrope']] as const) {
  if (!font.style.fontFamily.includes(`'${name}'`) && !font.style.fontFamily.includes(`"${name}"`)) {
    throw new Error(`next/font exposes ${name} as ${font.style.fontFamily}; styles/style.css expects the plain family name.`);
  }
}

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
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <StartProjectProvider>
          <a className="skip" href="#main">Skip to content</a>
          <SiteHeader>
            <main id="main">{children}</main>
            <SiteFooter />
          </SiteHeader>
          <RouteFocus />
        </StartProjectProvider>
      </body>
    </html>
  );
}
