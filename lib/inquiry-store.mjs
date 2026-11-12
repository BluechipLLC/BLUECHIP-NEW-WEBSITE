import { open, mkdir, readFile, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export function createInquiryStore(directory) {
  const pending = new Map();
  const filename = id => join(directory, `${id}.json`);

  async function read(id) {
    try {
      return JSON.parse(await readFile(filename(id), 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      return null;
    }
  }

  async function write(record) {
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
      await unlink(temporary).catch(error => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }

  // Serialize retries and webhook updates for each record within the Node process.
  async function lock(id, operation) {
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
