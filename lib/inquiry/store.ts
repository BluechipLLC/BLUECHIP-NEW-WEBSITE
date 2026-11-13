import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import type { CategoryKey } from './fields';

export type Project = {
  business: string;
  name: string;
  email: string;
  phone: string;
  category: CategoryKey;
  services: string[];
  description: string;
  timeline: string;
  budget: string;
  contactMethod: string;
};

export type InquiryStatus = 'booking_started' | 'submitted' | 'booking_confirmed' | 'booking_pending' | 'booking_cancelled';

export type InquiryRecord = {
  id: string;
  source: 'bluechip-website';
  createdAt: string;
  status: InquiryStatus;
  project?: Project;
  submittedAt?: string;
  notification?: 'sent' | 'failed' | 'unconfigured';
  booking?: { id: number; uid: string; start: string; timeZone?: string; updatedAt: string };
};

/**
 * Where inquiries are kept. The file store below suits a single Node process with a persistent
 * disk; a serverless host needs another implementation (a database or object store) with the
 * same interface and a lock that holds across instances.
 */
export type InquiryStore = {
  read(id: string): Promise<InquiryRecord | null>;
  write(record: InquiryRecord): Promise<void>;
  /** Run `operation` exclusively for one record. */
  lock<T>(id: string, operation: () => Promise<T>): Promise<T>;
};

/** One JSON file per inquiry, written atomically, with per-record locking within this process. */
export function createFileStore(directory: string): InquiryStore {
  const pending = new Map<string, Promise<unknown>>();
  const filename = (id: string) => join(directory, `${id}.json`);

  async function read(id: string) {
    try {
      return JSON.parse(await readFile(filename(id), 'utf8')) as InquiryRecord;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      return null;
    }
  }

  async function write(record: InquiryRecord) {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const temporary = join(directory, `.${randomUUID()}.tmp`);
    try {
      const file = await open(temporary, 'wx', 0o600);
      try {
        await file.writeFile(JSON.stringify(record, null, 2) + '\n');
        await file.sync();
      } finally {
        await file.close();
      }
      await rename(temporary, filename(record.id));
      const parent = await open(directory, 'r');
      try {
        await parent.sync();
      } finally {
        await parent.close();
      }
    } finally {
      await unlink(temporary).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }

  // Serialize retries and webhook updates for each record within the Node process.
  async function lock<T>(id: string, operation: () => Promise<T>): Promise<T> {
    const next = (pending.get(id) ?? Promise.resolve()).catch(() => {}).then(operation);
    pending.set(id, next);
    try {
      return await next;
    } finally {
      if (pending.get(id) === next) pending.delete(id);
    }
  }

  return { read, write, lock };
}
