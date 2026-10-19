'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GalleryUpload from '@/components/admin/GalleryUpload';
import { useToast } from '@/components/admin/ToastProvider';
import { friendlyError } from '@/lib/fieldLabels';
import type { AppSettings, GalleryItem, GalleryLayout, GalleryPosition } from '@/lib/types';

type PhotoChange = Partial<Pick<GalleryItem, 'caption' | 'size' | 'focus'>>;

const LAYOUTS: { value: GalleryLayout; label: string; note: string }[] = [
  { value: 'masonry', label: 'Masonry', note: 'Columns with mixed heights' },
  { value: 'grid', label: 'Grid', note: 'Even squares in rows' },
  { value: 'slideshow', label: 'Slideshow', note: 'One row guests swipe through' }
];

const POSITIONS: { value: GalleryPosition; label: string }[] = [
  { value: 'after_story', label: 'After the story and couple' },
  { value: 'after_events', label: 'After the events, rundown and dress code' },
  { value: 'before_rsvp', label: 'Just before the RSVP' }
];

const FOCUS_OPTIONS: { value: GalleryItem['focus']; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'center', label: 'Center' },
  { value: 'bottom', label: 'Bottom' }
];

// Small drawing of each layout, so the choice is clear without trying it.
function LayoutPreview({ layout }: { layout: GalleryLayout }) {
  const box = 'rounded-sm';
  const fill = { background: 'var(--adm-accent)', opacity: 0.55 };
  if (layout === 'grid') {
    return (
      <div className="grid h-12 w-16 grid-cols-3 gap-0.5">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className={box} style={fill} />)}
      </div>
    );
  }
  if (layout === 'slideshow') {
    return (
      <div className="flex h-12 w-16 items-center gap-0.5 overflow-hidden">
        {[0, 1, 2].map((i) => <div key={i} className={`${box} h-10 w-7 shrink-0`} style={fill} />)}
      </div>
    );
  }
  return (
    <div className="flex h-12 w-16 gap-0.5">
      {[['h-7', 'h-4'], ['h-4', 'h-7'], ['h-6', 'h-5']].map((col, i) => (
        <div key={i} className="flex flex-1 flex-col gap-0.5">
          {col.map((h, j) => <div key={j} className={`${box} ${h}`} style={fill} />)}
        </div>
      ))}
    </div>
  );
}

function choiceStyle(selected: boolean) {
  return selected
    ? { border: '1px solid var(--adm-accent)', background: 'rgba(122,158,122,0.15)', color: '#C8DEC8' }
    : { border: '1px solid var(--adm-border-strong)', color: 'var(--adm-text-muted)' };
}

function SortableItem({
  item,
  index,
  onChange,
  onDelete
}: {
  item: GalleryItem;
  index: number;
  onChange: (id: string, change: PhotoChange) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const [caption, setCaption] = useState(item.caption);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  const name = `Photo ${index + 1}`;

  return (
    <div ref={setNodeRef} style={style} className="admin-card grid gap-3 p-3" data-testid="gallery-item">
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center"
          style={{ color: 'var(--adm-text-faint)' }}
        >
          ⋮⋮
        </div>
        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl sm:w-24">
          <Image
            src={item.url}
            alt={item.caption || 'Gallery'}
            fill
            sizes="6rem"
            className={`object-cover ${item.focus === 'top' ? 'object-top' : item.focus === 'bottom' ? 'object-bottom' : 'object-center'}`}
          />
        </div>
        <input
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          onBlur={() => caption !== item.caption && onChange(item.id, { caption })}
          maxLength={200}
          placeholder="Caption (optional)"
          aria-label={`${name} caption`}
          className="admin-input min-w-0 flex-1"
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs" style={{ color: 'var(--adm-text-muted)' }}>
        <div className="flex items-center gap-2" role="group" aria-label={`${name} size`}>
          Size
          {(['normal', 'large'] as const).map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={item.size === size}
              onClick={() => item.size !== size && onChange(item.id, { size })}
              className="min-h-[44px] rounded-full px-3 capitalize"
              style={choiceStyle(item.size === size)}
            >
              {size}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2">
          Keep in view
          <select
            value={item.focus}
            onChange={(event) => onChange(item.id, { focus: event.target.value as GalleryItem['focus'] })}
            aria-label={`${name} focus`}
            className="admin-input min-h-[44px] py-1"
          >
            {FOCUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => onDelete(item.id)} className="admin-btn-danger ml-auto">
          Delete
        </button>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const toast = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  // A small drag distance keeps taps and scrolling on phones from starting a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    fetch('/api/gallery')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setItems(data.data);
        setLoaded(true);
      })
      .catch(() => toast('Could not load the gallery. Please refresh the page.', 'error'));
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setSettings(data.data);
      })
      .catch(() => undefined);
  }, [toast]);

  // Layout and position save right away (the rest of Settings is sent unchanged).
  const saveDisplay = async (change: Partial<Pick<AppSettings, 'gallery_layout' | 'gallery_position'>>) => {
    if (!settings) return;
    const next = { ...settings, ...change };
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme: next.theme,
        show_gallery: next.show_gallery,
        show_envelope: next.show_envelope,
        gallery_layout: next.gallery_layout,
        gallery_position: next.gallery_position
      })
    }).catch(() => null);
    if (!response?.ok) {
      toast('Failed to save the gallery layout.', 'error');
      return;
    }
    setSettings(next);
    toast('Gallery layout saved.');
  };

  const handleUpload = async (url: string, caption: string): Promise<boolean> => {
    const response = await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // No order_index: the server puts the photo last, also when several are added in a row.
      body: JSON.stringify({ url, caption })
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    if (!data?.success) {
      toast(friendlyError(data?.error, 'Failed to add the photo.'), 'error');
      return false;
    }
    setItems((prev) => [...prev, data.data]);
    return true;
  };

  const handleChange = async (id: string, change: PhotoChange) => {
    const response = await fetch(`/api/gallery/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(change)
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    if (!data?.success) {
      toast('Failed to update the photo.', 'error');
      return;
    }
    setItems((prev) => prev.map((item) => (item.id === id ? data.data : item)));
    toast('Photo updated.');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this photo from the gallery?')) return;
    const response = await fetch(`/api/gallery/${id}`, { method: 'DELETE' }).catch(() => null);
    if (!response?.ok) {
      toast('Failed to delete the photo.', 'error');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast('Photo deleted.');
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId || activeId === overId) return;
    const oldIndex = items.findIndex((item) => item.id === activeId);
    const newIndex = items.findIndex((item) => item.id === overId);
    const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      order_index: index
    }));
    setItems(reordered);

    const responses = await Promise.all(
      reordered.map((item) =>
        fetch(`/api/gallery/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: item.order_index })
        }).catch(() => null)
      )
    );
    toast(responses.every((r) => r?.ok) ? 'New order saved.' : 'Some photos could not be reordered. Please refresh.', responses.every((r) => r?.ok) ? 'success' : 'error');
  };

  return (
    <div className="space-y-6">
      <GalleryUpload onUpload={handleUpload} />

      <section className="admin-card p-4 sm:p-6" aria-labelledby="gallery-look">
        <h2 id="gallery-look" className="font-display text-lg italic" style={{ color: '#C8DEC8' }}>
          How the gallery looks
        </h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--adm-text-muted)' }}>
          Changes save right away. Show or hide the whole gallery in Settings.
        </p>
        <fieldset disabled={!settings} className="m-0 mt-4 min-w-0 border-0 p-0">
          <legend className="admin-label">Layout</legend>
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Gallery layout">
            {LAYOUTS.map((layout) => {
              const selected = settings?.gallery_layout === layout.value;
              return (
                <button
                  key={layout.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => !selected && saveDisplay({ gallery_layout: layout.value })}
                  className="flex items-center gap-3 rounded-lg p-3 text-left"
                  style={choiceStyle(selected)}
                >
                  <LayoutPreview layout={layout.value} />
                  <span>
                    <span className="block text-sm">{layout.label}</span>
                    <span className="block text-[11px]" style={{ color: 'var(--adm-text-faint)' }}>{layout.note}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <label className="mt-4 block">
            <span className="admin-label">Place on the invitation</span>
            <select
              value={settings?.gallery_position ?? 'after_events'}
              onChange={(event) => saveDisplay({ gallery_position: event.target.value as GalleryPosition })}
              className="admin-input w-full sm:w-auto"
            >
              {POSITIONS.map((position) => (
                <option key={position.value} value={position.value}>
                  {position.label}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      </section>

      {loaded && items.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm" style={{ borderColor: 'var(--adm-border-strong)', color: 'var(--adm-text-muted)' }}>
          No photos yet. The gallery stays hidden on the invitation until a photo is added.
        </p>
      )}
      {items.length > 0 && (
        <p className="text-xs" style={{ color: 'var(--adm-text-faint)' }}>
          Drag ⋮⋮ to change the order. Large photos take the full width; &quot;Keep in view&quot; picks the part of the photo kept
          when it is cropped.
        </p>
      )}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)}>
          <div className="space-y-3">
            {items.map((item, index) => (
              <SortableItem key={item.id} item={item} index={index} onChange={handleChange} onDelete={handleDelete} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
