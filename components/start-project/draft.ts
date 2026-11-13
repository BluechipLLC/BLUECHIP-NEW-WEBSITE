import { budgets, categories, isCategory, timelines, type CategoryKey } from '@/lib/inquiry/fields';

export type DraftField = 'business' | 'description' | 'timeline' | 'budget' | 'name' | 'email' | 'phone' | 'contactMethod';
export const draftFields: DraftField[] = ['business', 'description', 'timeline', 'budget', 'name', 'email', 'phone', 'contactMethod'];

export type Draft = {
  token: string;
  category: CategoryKey | '';
  selections: Partial<Record<CategoryKey, string[]>>;
  /** Saved when the inquiry was stored but its email notification failed. */
  receipt?: { id: string };
} & Partial<Record<DraftField, string>>;

/** Service links (`/start?service=branding`) preselect matching services in each category. */
export const presets: Record<string, Partial<Record<CategoryKey, string[]>>> = {
  branding: { launch: ['Brand Identity'], refresh: ['Rebranding'], production: ['Logo & Graphic Design'] },
  websites: { launch: ['Website Design & Development'], refresh: ['Website Redesign'], production: ['Website Development'] },
  signage: { launch: ['Storefront Signage'], refresh: ['Signage & Storefront Graphics'], production: ['Signs & Banners'] },
  printing: { launch: ['Printed Materials'], refresh: ['Marketing Materials'], production: ['Business Cards & Print'] },
  'vehicle-wraps': { launch: ['Vehicle Graphics'], production: ['Vehicle Wraps & Graphics'] },
};

const draftKey = 'bluechip-project-draft';
const legacyKey = 'bluechip-inquiry';

export const freshDraft = (): Draft => ({ token: crypto.randomUUID(), category: '', selections: {} });

type LegacyDraft = {
  services?: string[];
  company?: string;
  message?: string;
  name?: string;
  email?: string;
  phone?: string;
  timeline?: string;
  budget?: string;
};

export function readDraft(): Draft {
  try {
    const current = JSON.parse(sessionStorage.getItem(draftKey) ?? 'null') as Draft | null;
    if (current?.token && current.selections) return current;
    // Carry over a draft saved by the previous single-page inquiry form.
    const old = JSON.parse(localStorage.getItem(legacyKey) ?? 'null') as LegacyDraft | null;
    if (old) {
      const category: CategoryKey = old.services?.includes('launch') ? 'launch' : old.services?.includes('refresh') ? 'refresh' : 'production';
      return {
        token: crypto.randomUUID(),
        category,
        business: old.company,
        description: old.message,
        name: old.name,
        email: old.email,
        phone: old.phone,
        timeline: (timelines as readonly string[]).includes(old.timeline ?? '') ? old.timeline : '',
        budget: (budgets as readonly string[]).includes(old.budget ?? '') ? old.budget : '',
        selections: { [category]: old.services?.flatMap(service => presets[service]?.[category] ?? []) ?? [] },
      };
    }
  } catch {}
  return freshDraft();
}

export function saveDraft(draft: Draft) {
  try { sessionStorage.setItem(draftKey, JSON.stringify(draft)); } catch {}
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(draftKey);
    localStorage.removeItem(legacyKey);
  } catch {}
}

/** Apply `?service=` (or the service page the visitor is on) to the draft. */
export function applyService(draft: Draft, service: string | null | undefined): Draft {
  const next: Draft = { ...draft, selections: { ...draft.selections } };
  if (service === 'launch' || service === 'refresh') next.category = service;
  if (service && Object.hasOwn(presets, service)) {
    next.category ||= 'production';
    for (const [category, choices] of Object.entries(presets[service])) {
      if (!isCategory(category)) continue;
      next.selections[category] = [...new Set([...(next.selections[category] ?? []), ...(choices ?? [])])];
    }
  }
  return next;
}

export const servicesFor = (category: CategoryKey) => categories[category].services as readonly string[];
