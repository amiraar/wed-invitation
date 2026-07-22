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
    <form onSubmit={handleSubmit} className="admin-card grid gap-3 p-4">
      <input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="Image URL"
        className="admin-input"
      />
      <input
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        placeholder="Caption"
        className="admin-input"
      />
      <button type="submit" className="admin-btn-primary">
        Upload
      </button>
    </form>
  );
}
