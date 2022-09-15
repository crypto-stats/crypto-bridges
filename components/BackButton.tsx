import { useRouter } from 'next/router';
import styles from '../styles/BackButton.module.css';

export default function BackButton() {
  const router = useRouter();
  const onClick = () =>
    router.push(
      router.pathname.includes('/bridges/') ? '/bridges' : '/',
      undefined,
      { scroll: false },
    );
  return (
    <button onClick={onClick} className={styles.backButton}>
      <div className={styles.backArrow}>
        <span className={styles.backArrowTip}></span>
      </div>
      <p>Back</p>
    </button>
  );
}
