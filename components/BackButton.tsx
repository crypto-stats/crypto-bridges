import { useRouter } from 'next/router';
import styles from '../styles/BackButton.module.css';

export default function BackButton() {
  const router = useRouter();
  const onClick = () => router.push('/');
  return (
    <button onClick={onClick} className={styles.backButton}>
      {'<--'} Back to all
    </button>
  );
}
