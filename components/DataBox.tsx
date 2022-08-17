import styles from '../styles/NumberBox.module.css';

export interface IDataBoxProps {
  caption: string;
  value: string;
}

const DataBox = ({ caption, value }: IDataBoxProps) => {
  return (
    <div className={styles.numberBox}>
      <p className={styles.numberBoxCaption}>{caption}</p>
      <p className={styles.numberBoxValue}>{value}</p>
    </div>
  );
};

export default DataBox;
