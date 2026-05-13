'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GalleryUpload from '@/components/admin/GalleryUpload';
import type { GalleryItem } from '@/lib/types';

function SortableItem({ item, onDelete }: { item: GalleryItem; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-3"
    >
      <div {...attributes} {...listeners} className="cursor-grab text-gray-400">
        ⋮⋮
      </div>
      <div className="relative h-16 w-24 overflow-hidden rounded-xl">
        <Image src={item.url} alt={item.caption || 'Gallery'} fill className="object-cover" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-800">{item.caption || 'Tanpa caption'}</p>
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-500"
      >
        Hapus
      </button>
    </div>
  );
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    fetch('/api/gallery')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setItems(data.data);
      })
      .catch(() => undefined);
  }, []);

  const handleUpload = async (url: string, caption: string) => {
    const response = await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, caption, order_index: items.length })
    });
    const data = await response.json().catch(() => null);
    if (data?.success) setItems((prev) => [...prev, data.data]);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((item) => item.id !== id));
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

    await Promise.all(
      reordered.map((item) =>
        fetch(`/api/gallery/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: item.order_index })
        })
      )
    );
  };

  return (
    <div className="space-y-6">
      <GalleryUpload onUpload={handleUpload} />
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
