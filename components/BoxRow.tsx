import styles from '../styles/BoxRow.module.css';
import DataBox, { IDataBoxProps } from './DataBox';

export enum BoxAlign {
  Center,
  Left,
  Right,
}

interface IBoxProps {
  data:
    | [IDataBoxProps, IDataBoxProps]
    | [IDataBoxProps, IDataBoxProps, IDataBoxProps];
  align?: BoxAlign;
}

const BoxRow = ({ data, align = BoxAlign.Center }: IBoxProps) => {
  return (
    <div
      className={
        align === BoxAlign.Left
          ? styles.boxLeft
          : align === BoxAlign.Center
          ? styles.boxCenter
          : styles.boxRight
      }
    >
      {data.map((nBox, index) => (
        <DataBox key={index} caption={nBox.caption} value={nBox.value} />
      ))}
    </div>
  );
};

export default BoxRow;
