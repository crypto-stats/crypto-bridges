import { useRouter } from 'next/router';
import styles from '../styles/BackButton.module.css';

export default function BackButton() {
  const router = useRouter();
  const onClick = () => router.push('/', undefined, { scroll: false });
  return (
    <button onClick={onClick} className={styles.backButton}>
      &#129044; Back to all
    </button>
  );
}
