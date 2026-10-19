'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { put } from '@vercel/blob/client';
import { useToast } from './ToastProvider';
import { UPLOAD_RULES, uploadPath, uploadProblem, type UploadKind } from '@/lib/upload';

const httpsUrl = /^https:\/\/\S+$/i;

// Gets an upload token from our server (so its error message can be shown as-is), then sends the
// file straight from the browser to Vercel Blob. Returns the public URL.
export async function uploadFile(kind: UploadKind, file: File, onProgress?: (percent: number) => void): Promise<string> {
  const problem = uploadProblem(kind, file);
  if (problem) throw new Error(problem);
  const pathname = uploadPath(kind, file.name);
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'blob.generate-client-token', payload: { pathname, clientPayload: null, multipart: false } })
  }).catch(() => null);
  const data = await res?.json().catch(() => null);
  if (!res?.ok || !data?.clientToken) throw new Error(data?.error ?? 'Upload failed. Please try again.');
  try {
    const blob = await put(pathname, file, {
      access: 'public',
      token: data.clientToken,
      contentType: file.type,
      onUploadProgress: (event) => onProgress?.(Math.round(event.percentage))
    });
    return blob.url;
  } catch {
    throw new Error(`"${file.name}" could not be uploaded. Please check your connection and try again.`);
  }
}

// Drop files here or pick them with the button (keyboard friendly).
export function DropZone({
  kind,
  multiple = false,
  busyText,
  onFiles
}: {
  kind: UploadKind;
  multiple?: boolean;
  busyText: string | null;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const what = kind === 'image' ? (multiple ? 'photos' : 'a photo') : 'a music file';

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        if (busyText) return;
        const files = Array.from(event.dataTransfer.files);
        onFiles(multiple ? files : files.slice(0, 1));
      }}
      data-testid={`drop-${kind}`}
      className="rounded-lg border border-dashed px-4 py-5 text-center transition-colors"
      style={{
        borderColor: over ? 'var(--adm-accent)' : 'var(--adm-border-strong)',
        background: over ? 'rgba(122,158,122,0.12)' : 'rgba(255,255,255,0.02)'
      }}
    >
      {busyText ? (
        <p className="text-sm" style={{ color: 'var(--adm-text)' }} aria-live="polite">
          {busyText}
        </p>
      ) : (
        <>
          <p className="text-sm" style={{ color: 'var(--adm-text-muted)' }}>
            Drag & drop {what} here, or
          </p>
          <button type="button" onClick={() => inputRef.current?.click()} className="admin-btn-outline mt-2">
            Choose {multiple ? 'files' : 'file'}
          </button>
        </>
      )}
      <p className="mt-2 text-[11px]" style={{ color: 'var(--adm-text-faint)' }}>
        {UPLOAD_RULES[kind].hint}
      </p>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={UPLOAD_RULES[kind].accept}
        multiple={multiple}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          if (files.length) onFiles(files);
        }}
      />
    </div>
  );
}

// One media link (cover photo, venue photo, music): upload a file or paste a link, with a preview.
export default function FileDrop({
  kind,
  label,
  hint,
  value,
  onChange
}: {
  kind: UploadKind;
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const toast = useToast();
  const [progress, setProgress] = useState<number | null>(null);

  const handleFiles = async ([file]: File[]) => {
    if (!file) return;
    setProgress(0);
    try {
      onChange(await uploadFile(kind, file, setProgress));
      toast(`${kind === 'image' ? 'Photo' : 'Music'} uploaded. Press Save to keep it.`);
    } catch (error) {
      toast((error as Error).message, 'error');
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="min-w-0">
      <span className="admin-label">{label}</span>
      {httpsUrl.test(value) &&
        (kind === 'image' ? (
          <div className="relative mb-2 h-28 w-full overflow-hidden rounded-lg sm:w-48">
            <Image src={value} alt={`${label} preview`} fill sizes="12rem" className="object-cover" />
          </div>
        ) : (
          <audio controls preload="none" src={value} className="mb-2 w-full" aria-label={`${label} preview`} />
        ))}
      <DropZone kind={kind} busyText={progress === null ? null : `Uploading… ${progress}%`} onFiles={handleFiles} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="…or paste a link: https://"
        aria-label={`${label} link`}
        className="admin-input mt-2 w-full"
      />
      {hint && <span className="mt-1 block text-[11px]" style={{ color: 'var(--adm-text-faint)' }}>{hint}</span>}
    </div>
  );
}
