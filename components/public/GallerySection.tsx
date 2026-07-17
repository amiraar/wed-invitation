'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import SectionHeading from './SectionHeading';
import type { GalleryItem } from '@/lib/types';

type Props = {
  images: GalleryItem[];
};

// Varied tile heights give the masonry columns an organic rhythm.
const tileHeights = ['h-72', 'h-52', 'h-64', 'h-56', 'h-80', 'h-60'];

export default function GallerySection({ images }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
          <SectionHeading align="center" eyebrow="Galeri" title="Momen Kami" />

          <div className="mt-12 columns-2 gap-3 sm:gap-4 md:columns-3">
            {images.map((image, index) => (
              <motion.button
                key={image.id}
                variants={fadeUpVariant}
                className="group relative mb-3 w-full overflow-hidden rounded-2xl sm:mb-4"
                onClick={() => setActiveIndex(index)}
                aria-label={image.caption || `Foto ${index + 1}`}
              >
                <div className={`relative w-full ${tileHeights[index % tileHeights.length]}`}>
                  <Image
                    src={image.url}
                    alt={image.caption || `Foto ${index + 1}`}
                    fill
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
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
              aria-label="Tutup"
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
                  aria-label="Foto sebelumnya"
                >
                  ‹
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    step(1);
                  }}
                  className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-2xl text-white/80 transition hover:text-white sm:right-6"
                  aria-label="Foto berikutnya"
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
                alt={activeImage.caption || 'Foto galeri'}
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
