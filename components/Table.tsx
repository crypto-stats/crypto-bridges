import { usePlausible } from 'next-plausible';
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
  sortCombined?: boolean;
  limit?: number;
}

const sortIn = (a: ITableItem, b: ITableItem) => b.in - a.in;
const sortOut = (a: ITableItem, b: ITableItem) => b.tvl - a.tvl;
const combinedSorter = (a: ITableItem, b: ITableItem) => (b.tvl + b.in) - (a.tvl + a.in);

const Table = ({
  tableContent,
  children,
  title,
  listsChains,
  limit,
  valueIn = false,
  sortCombined = false,
}: ITableProps): ReactElement => {
  const plausible = usePlausible();
  const [collapsed, setCollapsed] = useState(true);
  const array = tableContent.sort(sortCombined ? combinedSorter : valueIn ? sortIn : sortOut);

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

  const toggleCollapsed = () => {
    if (collapsed) {
      plausible('expand-table', {
        props: {
          title,
        },
      });
    }
    setCollapsed(!collapsed);
  }

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
