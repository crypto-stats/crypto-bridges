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
  children: ReactNode;
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
      <h2>{title}</h2>
      <div className={children === undefined ? '' : styles.titleBox}>
        {children}
      </div>
      <ol className={styles.tableBox}>
        <li className={styles.item} key={0}>
          <div className={styles.head}>
            <p>## name</p>
            <p>value out</p>
            <p>value in</p>
          </div>
        </li>
        {tableContent
          .sort((a, b) => a.bridgedIn - b.bridgedIn)
          .map(({ name, logo, bridgedIn, bridgedOut }, index) => {
            return (
              <li key={index} className={styles.item}>
                <Link
                  href={`${listsChains ? 'chain' : 'bridge'}/${name
                    .split(' ')
                    .join('-')}`}
                  scroll={false}
                  passHref={true}
                >
                  <a>
                    <p>{addLeadingZero(index + 1)}</p>
                    <p>
                      <p>
                        <Image src={logo} width="20" height="20" alt="" />
                      </p>
                      <p>{name}</p>
                    </p>
                    <p>{bridgedOut}</p>
                    <p>{bridgedIn}</p>
                  </a>
                </Link>
              </li>
            );
          })}
      </ol>
    </div>
  );
};

export default Table;
