import Link from 'next/link';
import { ReactElement, ReactNode, useMemo, useState } from 'react';
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
  const [collapsed, setCollapsed] = useState(true);
  const toggleCollapsed = () => setCollapsed(!collapsed);
  const array = tableContent.sort((a, b) =>
    valueIn ? b.in - a.in : b.tvl - a.tvl,
  );
  const { minValue, maxValue } = useMemo(() => {
    const inflows = tableContent.map((v) => v.in);
    const outflows = tableContent.map((v) => v.tvl);
    const minInflow = Math.min.apply(null, inflows);
    const maxInflow = Math.max.apply(null, inflows);
    const minOutflow = Math.min.apply(null, outflows);
    const maxOutflow = Math.max.apply(null, outflows);
    return {
      minValue: Math.min(minInflow, minOutflow),
      maxValue: Math.max(maxInflow, maxOutflow),
    };
  }, [tableContent]);
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
              .slice(0, collapsed ? limit : undefined)
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
                              width: `${Math.round(
                                (100 *
                                  (content[valueIn ? 'in' : 'tvl'] -
                                    minValue)) /
                                  (maxValue - minValue),
                              )}%`,
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
                              width: `${Math.round(
                                (100 *
                                  (content[valueIn ? 'tvl' : 'in'] -
                                    minValue)) /
                                  (maxValue - minValue),
                              )}%`,
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
        <button className={styles.seeAll} onClick={toggleCollapsed}>
          {collapsed ? 'See all chains' : 'Collapse'}
        </button>
      )}
    </>
  );
};

export default Table;
