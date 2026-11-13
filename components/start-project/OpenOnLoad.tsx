'use client';

import { useEffect } from 'react';
import { useStartProject } from './StartProject';

/** On /start, open the dialog straight away. The page's own button stays as a fallback trigger. */
export function OpenOnLoad() {
  const { open } = useStartProject();
  useEffect(() => {
    open(document.querySelector<HTMLElement>('[data-project-entry]'), new URL(location.href));
  }, [open]);
  return null;
}
