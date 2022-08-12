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
};

export default function Motion(props: PropsWithChildren) {
  return (
    <m.div
      initial={'initial'}
      animate={'animate'}
      exit={'exit'}
      variants={ANIMATIONS}
    >
      {props.children}
    </m.div>
  );
}
