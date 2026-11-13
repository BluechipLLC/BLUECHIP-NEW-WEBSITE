import type { Metadata } from 'next';
import { Button, PageHead } from '@/components/sections';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <PageHead eyebrow="404" title="A little off course." description="That page doesn’t exist." />
      <section className="section">
        <Button href="/">Back to home</Button>
      </section>
    </>
  );
}
