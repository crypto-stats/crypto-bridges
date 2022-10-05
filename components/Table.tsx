import Link from 'next/link';
import { ReactElement, ReactNode, useState } from 'react';
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
  limit?: number;
}

const Table = ({
  tableContent,
  children,
  title,
  listsChains,
  limit,
  valueIn = false,
}: ITableProps): ReactElement => {
  const [limited, setLimited] = useState(limit !== undefined);
  const toggleLimited = () => setLimited(!limited);
  const array = tableContent.sort((a, b) =>
    valueIn ? b.in - a.in : b.tvl - a.tvl,
  );
  const minValue = array[array.length - 1][valueIn ? 'in' : 'tvl'];
  const maxValue = array[0][valueIn ? 'in' : 'tvl'];
  return (
    <>
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
            {array
              .slice(0, limited ? limit : undefined)
              .map((content, index) => {
                return (
                  <li key={content.id} className={styles.item}>
                    <Link
                      href={`/${listsChains ? 'chain' : 'bridges'}/${
                        content.id
                      }`}
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
                        <div>
                          <span
                            className={styles.valueBar}
                            style={{
                              width: `${
                                (100 *
                                  (content[valueIn ? 'in' : 'tvl'] -
                                    minValue)) /
                                (maxValue - minValue)
                              }px`,
                            }}
                          />
                          <p>{`${format(
                            valueIn ? content.in : content.tvl,
                          )}`}</p>
                        </div>
                        <div>
                          <span
                            className={styles.valueBar}
                            style={{
                              width: `${
                                (100 *
                                  (content[valueIn ? 'tvl' : 'in'] -
                                    minValue)) /
                                (maxValue - minValue)
                              }px`,
                            }}
                          />
                          <p>{`${format(
                            valueIn ? content.tvl : content.in,
                          )}`}</p>
                        </div>
                      </a>
                    </Link>
                  </li>
                );
              })}
          </ol>
        </div>
      </div>
      {limit !== undefined && (
        <button className={styles.seeAll} onClick={toggleLimited}>
          {limited ? 'See all chains' : 'Collapse'}
        </button>
      )}
    </>
  );
};

export default Table;
