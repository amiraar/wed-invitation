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
import type { GalleryItem } from '@/lib/types';

function SortableItem({ item, onDelete }: { item: GalleryItem; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} className="admin-card flex items-center gap-4 p-3">
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
        <Image src={item.url} alt={item.caption || 'Gallery'} fill className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm" style={{ color: 'var(--adm-text)' }}>{item.caption || 'No caption'}</p>
      </div>
      <button onClick={() => onDelete(item.id)} className="admin-btn-danger">
        Delete
      </button>
    </div>
  );
}

export default function GalleryPage() {
  const toast = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
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
  }, [toast]);

  const handleUpload = async (url: string, caption: string): Promise<boolean> => {
    const response = await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, caption, order_index: items.length })
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    if (!data?.success) {
      toast(friendlyError(data?.error, 'Failed to add the photo.'), 'error');
      return false;
    }
    setItems((prev) => [...prev, data.data]);
    toast('Photo added.');
    return true;
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
      {loaded && items.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm" style={{ borderColor: 'var(--adm-border-strong)', color: 'var(--adm-text-muted)' }}>
          No photos yet. The gallery stays hidden on the invitation until a photo is added.
        </p>
      )}
      {items.length > 1 && (
        <p className="text-xs" style={{ color: 'var(--adm-text-faint)' }}>Drag ⋮⋮ to change the order.</p>
      )}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)}>
          <div className="space-y-3">
            {items.map((item) => (
              <SortableItem key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
