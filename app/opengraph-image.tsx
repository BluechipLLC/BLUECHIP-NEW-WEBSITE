import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'Bluechip Branding & Design: branding, websites, and signage';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const chip = await readFile(join(process.cwd(), 'app/icon.png'), 'base64');
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 96px', background: '#00529c', color: 'white' }}>
        <img src={`data:image/png;base64,${chip}`} width={150} height={150} alt="" style={{ marginBottom: 36, background: 'white', borderRadius: 999 }} />
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>Every business has a next chapter.</div>
        <div style={{ fontSize: 34, marginTop: 28, opacity: 0.9 }}>Bluechip Branding &amp; Design · Branding, websites &amp; signage</div>
      </div>
    ),
    size,
  );
}
