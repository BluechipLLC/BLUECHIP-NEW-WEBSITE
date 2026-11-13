import Link from 'next/link';
import { contact, siteName } from '@/content/site';
import { serviceOrder, services } from '@/content/services';

export function SiteFooter() {
  return (
    <footer className="bluechip-footer">
      <div className="footer-contact">
        <Link className="footer-mark" href="/" aria-label="Bluechip home">
          <img src="/assets/bluechip-logo-white.webp" alt={siteName} />
        </Link>
        <div className="footer-contact-copy">
          <strong>{siteName}</strong>
          <p>{contact.region}</p>
          <div className="footer-links">
            <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <a href="/start">Contact</a>
          </div>
          <div className="footer-social">
            <a href={contact.instagram}>Instagram</a>
            <a href={contact.linkedin}>LinkedIn</a>
          </div>
          <small>© {new Date().getFullYear()} {siteName}. All rights reserved.</small>
        </div>
      </div>
      <nav className="footer-nav" aria-label="Footer navigation">
        <Link href="/work">Work</Link>
        <Link href="/services">Services</Link>
        {serviceOrder.map(slug => <Link key={slug} href={`/services/${slug}`}>{services[slug].name}</Link>)}
        <Link href="/about">About</Link>
      </nav>
      <div className="footer-inquiry">
        <h2>Let’s make something good.</h2>
        <p>Have a project in mind? We’d love to hear about it.</p>
        <a className="footer-button" href="/start">Start a project &gt;</a>
      </div>
    </footer>
  );
}
