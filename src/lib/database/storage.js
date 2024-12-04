import { kv } from '@vercel/kv';
import fs from 'fs/promises';
import path from 'path';

const isVercelEnv = process.env.VERCEL === '1';
const DATA_DIR = 'local-data';

export class Storage {
    static async init() {
        if (!isVercelEnv) {
            try {
                await fs.mkdir(DATA_DIR, { recursive: true });
            } catch (error) {
                console.error('Failed to create data directory:', error);
            }
        }
    }

    static async get(key) {
        if (isVercelEnv) {
            return await kv.get(key);
        } else {
            try {
                const filePath = path.join(DATA_DIR, `${key}.json`);
                const data = await fs.readFile(filePath, 'utf8');
                return JSON.parse(data);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    return null;
                }
                throw error;
            }
        }
    }

    static async set(key, value) {
        if (isVercelEnv) {
            return await kv.set(key, value);
        } else {
            const filePath = path.join(DATA_DIR, `${key}.json`);
            await fs.writeFile(filePath, JSON.stringify(value, null, 2));
        }
    }
}

await Storage.init();
