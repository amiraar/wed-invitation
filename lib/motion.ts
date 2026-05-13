export const fadeUpVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

export const staggerContainerVariant = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};

export const curtainVariant = {
  initial: { x: 0 },
  exit: (direction: 'left' | 'right') => ({
    x: direction === 'left' ? '-100%' : '100%',
    transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] }
  })
};

export const digitVariant = {
  enter: { y: -20, opacity: 0 },
  center: { y: 0, opacity: 1, transition: { duration: 0.3 } },
  exit: { y: 20, opacity: 0, transition: { duration: 0.3 } }
};
