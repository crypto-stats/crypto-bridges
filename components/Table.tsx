import Link from 'next/link';
import { ReactElement, ReactNode } from 'react';
import styles from '../styles/Table.module.css';
import { addLeadingZero, format } from '../utils';

export interface ITableItem {
  id: string;
  name?: string;
  logo: string;
  tvl: number;
  in: number;
}

export interface ITableProps {
  tableContent: ITableItem[];
  children?: ReactNode;
  title: string;
  listsChains: boolean;
  valueIn?: boolean;
}

const Table = ({
  tableContent,
  children,
  title,
  listsChains,
  valueIn = false,
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
          <p>{valueIn ? 'value imported' : 'value exported'}</p>
          <p>{valueIn ? 'value exported' : 'value imported'}</p>
        </div>
        <ol className={styles.list}>
          {tableContent
            .sort((a, b) => (valueIn ? b.in - a.in : b.tvl - a.tvl))
            .map((content, index) => {
              return (
                <li key={content.id} className={styles.item}>
                  <Link
                    href={`/${listsChains ? 'chain' : 'bridges'}/${content.id}`}
                    scroll={false}
                    passHref={true}
                  >
                    <a>
                      <p className={styles.nameBox}>
                        <span>{addLeadingZero(index + 1)}</span>
                        <span>
                          <img
                            src={content.logo}
                            width="20"
                            height="20"
                            alt=""
                          />
                        </span>
                        <span className={styles.name}>
                          {content.name || content.id.replaceAll('-', ' ')}
                        </span>
                      </p>
                      <p>{`${format(valueIn ? content.in : content.tvl)}`}</p>
                      <p>{`${format(valueIn ? content.tvl : content.in)}`}</p>
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
