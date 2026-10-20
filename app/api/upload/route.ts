import { NextResponse, type NextRequest } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { jsonError } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { UPLOAD_PATH_RE, UPLOAD_RULES, type UploadKind } from '@/lib/upload';

// The browser uploads photos and music straight to Vercel Blob (no 4.5 MB function body limit);
// this route only hands a short-lived upload token to a logged-in admin.
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  // Only token requests are accepted; there is no upload-completed callback to handle.
  if (body?.type !== 'blob.generate-client-token') return jsonError('Invalid request.', 400);
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return jsonError("File upload isn't set up yet (connect a Vercel Blob store). You can paste a link instead.", 503);
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const kind = UPLOAD_PATH_RE.exec(pathname)?.[1] as UploadKind | undefined;
        if (!kind) throw new Error('Invalid file name.');
        const rules = UPLOAD_RULES[kind];
        return { allowedContentTypes: rules.types, maximumSizeInBytes: rules.maxBytes, addRandomSuffix: true };
      }
    });
    return NextResponse.json(result);
  } catch {
    return jsonError('This file cannot be uploaded.', 400);
  }
}
