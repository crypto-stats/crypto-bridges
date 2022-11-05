import Link from 'next/link';
import { ReactElement, ReactNode, useMemo, useState } from 'react';
import styles from '../styles/Table.module.css';
import { addLeadingZero, format } from '../utils';

export interface IBridgeTableItem {
  id: string;
  name?: string;
  logo: string;
  tvl: number;
}

export interface IBridgeTableProps {
  tableContent: IBridgeTableItem[];
  children?: ReactNode;
  title: string;
  limit?: number;
}

const BridgeTable = ({
  tableContent,
  children,
  title,
  limit,
}: IBridgeTableProps): ReactElement => {
  const [collapsed, setCollapsed] = useState(true);
  const toggleCollapsed = () => setCollapsed(!collapsed);
  const { minValue, maxValue } = useMemo(() => {
    const tvl = tableContent.map((v) => v.tvl);
    const minTvl = Math.min.apply(null, tvl);
    const maxTvl = Math.max.apply(null, tvl);
    return {
      minValue: minTvl,
      maxValue: maxTvl,
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
            <p>{'TVL'}</p>
          </div>
          <ol className={styles.list}>
            {tableContent
              .sort((a, b) => b.tvl - a.tvl)
              .slice(0, collapsed ? limit : undefined)
              .map((content, index) => {
                return (
                  <li key={content.id} className={styles.item}>
                    <Link
                      href={`/bridges/${content.id}`}
                      scroll={false}
                      passHref={true}
                    >
                      <a>
                        <p className={`${styles.nameBox} ${styles.autoWidth}`}>
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
                                (100 * (content.tvl - minValue)) /
                                  (maxValue - minValue),
                              )}%`,
                            }}
                          />
                          <p>{`${format(content.tvl)}`}</p>
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
          {collapsed ? 'See all' : 'Collapse'}
        </button>
      )}
    </>
  );
};

export default BridgeTable;
