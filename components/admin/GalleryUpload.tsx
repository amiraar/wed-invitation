'use client';

import { useState } from 'react';
import { DropZone, uploadFile } from './FileDrop';
import { useToast } from './ToastProvider';

// Adds photos by upload (several at once) or by link. Link fields are only cleared when the photo was saved.
export default function GalleryUpload({ onUpload }: { onUpload: (url: string, caption: string) => Promise<boolean> }) {
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyText, setBusyText] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    let added = 0;
    const failed: string[] = [];
    let firstError = '';
    // Progress events are throttled and can arrive late; once done, they must not bring the busy text back.
    let done = false;
    for (const [index, file] of files.entries()) {
      try {
        const uploaded = await uploadFile('image', file, (percent) => {
          if (!done) setBusyText(`Uploading ${index + 1} of ${files.length}… ${percent}%`);
        });
        if (await onUpload(uploaded, '')) added += 1;
        else failed.push(file.name);
      } catch (error) {
        failed.push(file.name);
        firstError ||= (error as Error).message;
      }
    }
    done = true;
    setBusyText(null);
    if (failed.length) {
      toast(`${added} added, ${failed.length} not added${firstError ? `: ${firstError}` : '.'}`, 'error');
    } else {
      toast(added === 1 ? 'Photo added.' : `${added} photos added.`);
    }
  };

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!url) return;
    setSaving(true);
    const saved = await onUpload(url, caption);
    setSaving(false);
    if (saved) {
      setUrl('');
      setCaption('');
      toast('Photo added.');
    }
  };

  return (
    <div className="admin-card grid gap-4 p-4">
      <DropZone kind="image" multiple busyText={busyText} onFiles={handleFiles} />
      <form onSubmit={handleSubmit} className="grid gap-3">
        <p className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>
          …or add a photo by link
        </p>
        <label className="block">
          <span className="admin-label">Image URL</span>
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Image URL" className="admin-input w-full" />
          <span className="mt-1 block text-[11px]" style={{ color: 'var(--adm-text-faint)' }}>
            A link to a photo that starts with https:// (e.g. from Google Photos or Imgur).
          </span>
        </label>
        <label className="block">
          <span className="admin-label">Caption (optional)</span>
          <input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Caption" className="admin-input w-full" />
        </label>
        <button type="submit" disabled={!url || saving} className="admin-btn-primary disabled:opacity-50">
          {saving ? 'Adding...' : 'Add Photo'}
        </button>
      </form>
    </div>
  );
}
