import type { PropsWithChildren } from 'react';
import styles from '../styles/Content.module.css';

export default function Content(props: PropsWithChildren) {
  return <div className={styles.content}>{props.children}</div>;
}
