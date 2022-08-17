import Image from 'next/image';
import Link from 'next/link';
import { ReactElement, ReactNode } from 'react';
import styles from '../styles/Table.module.css';
import { addLeadingZero } from '../utils';

export interface ITableItem {
  name: string;
  logo: string;
  bridgedOut: number;
  bridgedIn: number;
}

export interface ITableProps {
  tableContent: ITableItem[];
  children?: ReactNode;
  title: string;
  listsChains: boolean;
}

const Table = ({
  tableContent,
  children,
  title,
  listsChains,
}: ITableProps): ReactElement => {
  return (
    <div className={styles.table}>
      <div className={styles.titleBox}>
        <h2>{title}</h2>
        {children !== undefined ? <div>{children}</div> : ''}
      </div>
      <div className={styles.tableContent}>
        <div className={styles.head}>
          <p>
            <span>##</span>
            <span className={styles.imageGap}></span>
            <span>name</span>
          </p>
          <p>value out</p>
          <p>value in</p>
        </div>
        <ol className={styles.list}>
          {tableContent
            .sort((a, b) => b.bridgedIn - a.bridgedIn)
            .map(({ name, logo, bridgedIn, bridgedOut }, index) => {
              return (
                <li key={index} className={styles.item}>
                  <Link
                    href={`/${listsChains ? 'chain' : 'bridge'}/${name
                      .split(' ')
                      .join('-')}`}
                    scroll={false}
                    passHref={true}
                  >
                    <a>
                      <p className={styles.nameBox}>
                        <span className={styles.vAlign}>
                          {addLeadingZero(index + 1)}
                        </span>
                        <span className={styles.vAlign}>
                          <Image src={logo} width="20" height="20" alt="" />
                        </span>
                        <span className={styles.vAlign}>{name}</span>
                      </p>
                      <p>{bridgedOut?.toFixed(0)}</p>
                      <p>{bridgedIn?.toFixed(0)}</p>
                    </a>
                  </Link>
                </li>
              );
            })}
        </ol>
      </div>
    </div>
  );
};

export default Table;
