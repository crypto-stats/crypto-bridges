import type { Variants } from 'framer-motion';
import { m } from 'framer-motion';
import type { PropsWithChildren } from 'react';

const ANIMATIONS: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: 10,
  },
  transition: {
    ease: 'easeOut',
    duration: 0.5,
  } as any,
};

export default function Motion(props: PropsWithChildren) {
  return (
    <m.div
      initial={'initial'}
      animate={'animate'}
      exit={'exit'}
      transition={ANIMATIONS.transition}
      variants={ANIMATIONS}
    >
      {props.children}
    </m.div>
  );
}
