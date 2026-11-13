import { budgets, categories, contactMethods, isCategory, limits, timelines } from './fields';
import type { Project } from './store';

export class RequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

function textField(value: unknown, label: string, max: number, required = false) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if ((required && !normalized) || normalized.length > max || /[\u0000-\u0008\u000b-\u001f\u007f]/.test(normalized)) {
    throw new RequestError(422, `Check the ${label} and try again.`);
  }
  return normalized;
}

function choice(value: unknown, choices: readonly string[], label: string) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || !choices.includes(value)) throw new RequestError(422, `Choose a valid ${label}.`);
  return value;
}

export function validateProject(input: Record<string, unknown>): Project {
  const { category, services } = input;
  if (!isCategory(category)) throw new RequestError(422, 'Choose a project category.');
  const allowed: readonly string[] = categories[category].services;
  if (!Array.isArray(services) || !services.length || services.length > allowed.length || !services.every(service => allowed.includes(service))) {
    throw new RequestError(422, 'Choose at least one service for this project category.');
  }
  const email = textField(input.email, 'email address', limits.email, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new RequestError(422, 'Enter a valid email address.');
  return {
    business: textField(input.business, 'business name', limits.business, true),
    name: textField(input.name, 'full name', limits.name, true),
    email,
    phone: textField(input.phone, 'phone number', limits.phone),
    category,
    services: allowed.filter(service => services.includes(service)),
    description: textField(input.description, 'project description', limits.description, true),
    timeline: choice(input.timeline, timelines, 'timeline'),
    budget: choice(input.budget, budgets, 'budget'),
    contactMethod: choice(input.contactMethod, contactMethods, 'contact method'),
  };
}
