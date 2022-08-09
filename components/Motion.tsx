import { m } from 'framer-motion';
import type { PropsWithChildren } from 'react';

const animation = {
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
  },
};
export default function Motion(props: PropsWithChildren) {
  return (
    <m.div
      initial={animation.initial}
      animate={animation.animate}
      exit={animation.exit}
      transition={animation.transition}
      variants={animation}
    >
      {props.children}
    </m.div>
  );
}
