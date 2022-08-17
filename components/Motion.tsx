import type { Variants } from 'framer-motion';
import { m } from 'framer-motion';
import type { PropsWithChildren } from 'react';

const ANIMATIONS: Variants = {
  initial: {
    opacity: 0,
    x: 100,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: 100,
  },
};

export default function Motion(props: PropsWithChildren) {
  return (
    <m.div
      initial={'initial'}
      animate={'animate'}
      exit={'exit'}
      variants={ANIMATIONS}
      transition={{ duration: 0.5 }}
    >
      {props.children}
    </m.div>
  );
}
