'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import type { GalleryItem } from '@/lib/types';

type Props = {
  images: GalleryItem[];
};

export default function GallerySection({ images }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section id="gallery" className="section-anchor py-20">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <motion.p variants={fadeUpVariant} className="text-xs uppercase tracking-[0.4em] text-text-muted">
            Galeri
          </motion.p>
          <motion.h2 variants={fadeUpVariant} className="mt-3 font-display text-3xl italic">
            Momen Kami
          </motion.h2>
          <div className="mt-10 columns-2 gap-4 md:columns-3">
            {images.map((image, index) => (
              <motion.button
                key={image.id}
                variants={fadeUpVariant}
                className="relative mb-4 w-full overflow-hidden rounded-2xl"
                onClick={() => setActiveIndex(index)}
              >
                <div className="relative h-64 w-full">
                  <Image src={image.url} alt={image.caption || 'Gallery'} fill className="object-cover" />
                </div>
                <div className="absolute inset-0 bg-bg-primary/20 opacity-0 transition hover:opacity-100" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {activeIndex !== null && images[activeIndex] && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveIndex(null)}
          >
            <motion.div
              className="relative h-[70vh] w-full max-w-3xl"
              layoutId={`gallery-${images[activeIndex].id}`}
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={images[activeIndex].url}
                alt={images[activeIndex].caption || 'Gallery'}
                fill
                className="object-cover"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
