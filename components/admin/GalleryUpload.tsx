'use client';

import { useState } from 'react';

// Adds a photo by link. The fields are only cleared when the photo was actually saved.
export default function GalleryUpload({ onUpload }: { onUpload: (url: string, caption: string) => Promise<boolean> }) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!url) return;
    setSaving(true);
    const saved = await onUpload(url, caption);
    setSaving(false);
    if (saved) {
      setUrl('');
      setCaption('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-card grid gap-3 p-4">
      <label className="block">
        <span className="admin-label">Image URL</span>
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Image URL" className="admin-input w-full" />
        <span className="mt-1 block text-[11px]" style={{ color: 'var(--adm-text-faint)' }}>
          Paste a link to a photo that starts with https:// (e.g. from Google Photos or Imgur).
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
  );
}
