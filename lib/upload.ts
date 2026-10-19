// Upload rules shared by the browser (early, friendly checks) and /api/upload (enforced in the token).
export type UploadKind = 'image' | 'audio';

export const UPLOAD_RULES: Record<UploadKind, { types: string[]; maxBytes: number; accept: string; hint: string }> = {
  image: {
    types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxBytes: 10 * 1024 * 1024,
    accept: 'image/jpeg,image/png,image/webp,image/gif',
    hint: 'JPG, PNG, WebP or GIF, up to 10 MB.'
  },
  audio: {
    types: ['audio/mpeg', 'audio/mp4', 'audio/x-m4a'],
    maxBytes: 15 * 1024 * 1024,
    accept: 'audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a',
    hint: 'MP3 or M4A, up to 15 MB.'
  }
};

export const UPLOAD_PATH_RE = /^wedding\/(image|audio)\/[a-z0-9][a-z0-9._-]{0,99}$/;

// "My Photo (1).JPG" → "wedding/image/my-photo-1-.jpg"; Vercel Blob adds a random suffix.
export function uploadPath(kind: UploadKind, fileName: string): string {
  const safe = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .slice(-100)
    .replace(/^[^a-z0-9]+/, '');
  return `wedding/${kind}/${safe || 'file'}`;
}

// A readable reason why a file can't be uploaded, or null when it's fine.
export function uploadProblem(kind: UploadKind, file: { name: string; type: string; size: number }): string | null {
  const rules = UPLOAD_RULES[kind];
  if (!rules.types.includes(file.type)) return `"${file.name}" isn't a supported file. ${rules.hint}`;
  if (file.size > rules.maxBytes) return `"${file.name}" is too large. ${rules.hint}`;
  return null;
}
