import styles from './Loader.module.css';
import { withBase } from '../utils/paths';

export default function Loader({ className = '', label = 'Loading', compact = false }) {
  return (
    <div className={`${styles.loader} ${compact ? styles.compact : ''} ${className}`.trim()} aria-label={label} role="status">
      <img src={withBase('app_icons/loader.gif')} alt="" className={styles.loaderImage} />
    </div>
  );
}