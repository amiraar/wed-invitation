import { neon } from '@neondatabase/serverless';
import { getEnv } from './env.ts';

const env = getEnv();

export const sql = neon(env.DATABASE_URL);
