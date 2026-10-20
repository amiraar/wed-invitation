'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import SectionHeading from './SectionHeading';
import type { GalleryItem, GalleryLayout } from '@/lib/types';

type Props = {
  images: GalleryItem[];
  layout: GalleryLayout;
};

// Varied tile heights give the masonry columns an organic rhythm.
const tileHeights = ['h-72', 'h-52', 'h-64', 'h-56', 'h-80', 'h-60'];

const LAYOUT_CLASS: Record<GalleryLayout, string> = {
  masonry: 'mt-12 columns-2 gap-3 sm:gap-4 md:columns-3',
  grid: 'mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3',
  // Swipe on phones; the buttons above scroll it too.
  slideshow: 'mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2'
};

const FOCUS_CLASS: Record<string, string> = { top: 'object-top', center: 'object-center', bottom: 'object-bottom' };

// "Large" photos take the full width in masonry and grid, and a wider slide in the slideshow.
function tileClass(layout: GalleryLayout, image: GalleryItem, index: number): string {
  const large = image.size === 'large';
  if (layout === 'grid') return `w-full ${large ? 'col-span-full aspect-[16/9]' : 'aspect-square'}`;
  if (layout === 'slideshow') {
    return `shrink-0 snap-center ${large ? 'w-[90%] aspect-[4/3] md:w-[70%]' : 'w-[80%] aspect-[4/5] sm:w-[45%] md:w-[32%]'}`;
  }
  return `mb-3 block w-full sm:mb-4 ${large ? '[column-span:all] h-80 md:h-[28rem]' : tileHeights[index % tileHeights.length]}`;
}

export default function GallerySection({ images, layout }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const slide = (direction: number) => {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' });
  };

  const close = useCallback(() => setActiveIndex(null), []);
  const step = useCallback(
    (delta: number) => {
      setActiveIndex((prev) => (prev === null ? null : (prev + delta + images.length) % images.length));
    },
    [images.length]
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') step(-1);
      if (event.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, close, step]);

  const activeImage = activeIndex !== null ? images[activeIndex] : null;

  return (
    <section id="gallery" className="section-anchor bg-bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <SectionHeading align="center" eyebrow="Moments" title="Our Gallery" />

          {layout === 'slideshow' && images.length > 1 && (
            <div className="mt-8 flex justify-center gap-3">
              <button onClick={() => slide(-1)} className="flex h-11 w-11 items-center justify-center rounded-full text-xl" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }} aria-label="Previous photos">
                ‹
              </button>
              <button onClick={() => slide(1)} className="flex h-11 w-11 items-center justify-center rounded-full text-xl" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }} aria-label="More photos">
                ›
              </button>
            </div>
          )}

          <div ref={trackRef} className={LAYOUT_CLASS[layout] ?? LAYOUT_CLASS.masonry} data-layout={layout}>
            {images.map((image, index) => (
              <motion.button
                key={image.id}
                variants={fadeUpVariant}
                className={`group relative overflow-hidden rounded-2xl ${tileClass(layout, image, index)}`}
                onClick={() => setActiveIndex(index)}
                aria-label={image.caption || `Photo ${index + 1}`}
                data-size={image.size}
              >
                <Image
                  src={image.url}
                  alt={image.caption || `Photo ${index + 1}`}
                  fill
                  sizes={image.size === 'large' || layout === 'slideshow' ? '(min-width: 768px) 70vw, 90vw' : '(min-width: 768px) 33vw, 50vw'}
                  className={`object-cover ${FOCUS_CLASS[image.focus] ?? 'object-center'} transition-transform duration-700 group-hover:scale-105`}
                />
                <div className="absolute inset-0 bg-black/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {activeImage && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-xl text-white/80 transition hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    step(-1);
                  }}
                  className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-2xl text-white/80 transition hover:text-white sm:left-6"
                  aria-label="Previous photo"
                >
                  ‹
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    step(1);
                  }}
                  className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-2xl text-white/80 transition hover:text-white sm:right-6"
                  aria-label="Next photo"
                >
                  ›
                </button>
              </>
            )}

            <motion.div
              key={activeImage.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative h-[75dvh] w-full max-w-4xl"
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={activeImage.url}
                alt={activeImage.caption || 'Gallery photo'}
                fill
                sizes="100vw"
                className="object-contain"
              />
              {activeImage.caption && (
                <p className="absolute inset-x-0 -bottom-2 translate-y-full text-center text-sm text-white/70">
                  {activeImage.caption}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
