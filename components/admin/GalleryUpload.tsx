'use client';

import { useState } from 'react';

export default function GalleryUpload({ onUpload }: { onUpload: (url: string, caption: string) => void }) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!url) return;
    onUpload(url, caption);
    setUrl('');
    setCaption('');
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4">
      <input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="URL gambar"
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        placeholder="Caption"
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-xl border border-amber-400 bg-amber-400 px-4 py-2 text-sm text-white"
      >
        Upload
      </button>
    </form>
  );
}
