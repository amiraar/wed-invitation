export type AppEnv = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV: string;
};

export function getEnv(): AppEnv {
  const { DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_APP_URL, NODE_ENV } = process.env;

  const missing: string[] = [];
  if (!DATABASE_URL) missing.push('DATABASE_URL');
  if (!JWT_SECRET) missing.push('JWT_SECRET');
  if (!NEXT_PUBLIC_APP_URL) missing.push('NEXT_PUBLIC_APP_URL');
  if (!NODE_ENV) missing.push('NODE_ENV');

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  return {
    DATABASE_URL,
    JWT_SECRET,
    NEXT_PUBLIC_APP_URL,
    NODE_ENV
  };
}
