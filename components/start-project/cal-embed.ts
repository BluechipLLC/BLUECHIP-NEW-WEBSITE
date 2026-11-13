/**
 * Minimal loader for Cal.com's embed script. It queues calls until `embed.js` arrives, matching
 * Cal.com's documented snippet, and reports a failed script load to the calendar mount.
 */

export const calOrigin = 'https://app.cal.com';

type Instruction = unknown[];
type Queue = ((...instruction: Instruction) => void) & { q: Instruction[] };
export type CalApi = ((...args: Instruction) => void) & { q: Instruction[]; ns: Record<string, Queue>; loaded: boolean };

declare global {
  interface Window { Cal?: CalApi }
}

export function calQueue(): CalApi {
  if (!window.Cal) {
    const cal = ((...args: Instruction) => {
      const [command, namespace] = args;
      if (command === 'init' && typeof namespace === 'string') {
        if (!cal.ns[namespace]) {
          const queue = ((...instruction: Instruction) => { queue.q.push(instruction); }) as Queue;
          queue.q = [];
          cal.ns[namespace] = queue;
        }
        cal.ns[namespace](...args);
        cal.q.push(['initNamespace', namespace]);
        return;
      }
      cal.q.push(args);
    }) as CalApi;
    cal.q = [];
    cal.ns = {};
    cal.loaded = true;
    window.Cal = cal;
    const script = document.createElement('script');
    script.src = `${calOrigin}/embed/embed.js`;
    script.async = true;
    script.addEventListener('error', () => {
      if (window.Cal === cal) delete window.Cal;
      script.remove();
      // Tell whichever calendar is mounted now; it may not be the one that started the load.
      document.querySelector('#start-project .project-calendar')?.dispatchEvent(new Event('cal-load-error'));
    });
    document.head.append(script);
  }
  return window.Cal;
}
