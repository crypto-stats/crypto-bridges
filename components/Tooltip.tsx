import style from '../styles/Tooltip.module.css';
import { formatShort } from '../utils';
import {
  TooltipBridgeArg,
  TooltipChainArg,
  TooltipFlowArg,
} from './NetworkDiagram';

interface ITooltipProps {
  showChainTooltip: TooltipChainArg;
  showFlowTooltip: TooltipFlowArg;
  showBridgeTooltip: TooltipBridgeArg;
}

export function Tooltip({
  showChainTooltip,
  showFlowTooltip,
  showBridgeTooltip,
}: ITooltipProps) {
  const showTooltip =
    showChainTooltip !== false ||
    showFlowTooltip !== false ||
    showBridgeTooltip !== false;
  const tooltip =
    showChainTooltip !== false
      ? showChainTooltip
      : showFlowTooltip !== false
      ? showFlowTooltip
      : showBridgeTooltip;
  if (tooltip === false || showTooltip === false) return null;
  return (
    <div
      className={style.tooltip}
      style={{
        top: `${tooltip.y}px`,
        left: `${tooltip.x}px`,
      }}
    >
      {showChainTooltip !== false && (
        <>
          <div className={style.chainTooltipTitle}>
            <img
              src={showChainTooltip.logo}
              alt={`${showChainTooltip.chain} logo`}
              width={20}
              height={20}
            />
            <p>{showChainTooltip.chain}</p>
          </div>
          <div className={style.chainData}>
            <div className={style.chainDataInput}>
              <p>Exported</p>
              <p className={style.value}>
                {formatShort(showChainTooltip.exports, 1)}
              </p>
            </div>
            <div className={style.chainDataInput}>
              <p>Imported</p>
              <p className={style.value}>
                {formatShort(showChainTooltip.imports, 1)}
              </p>
            </div>
          </div>
        </>
      )}
      {showFlowTooltip !== false && (
        <div className={style.flowTooltipFlex}>
          <div
            className={style.flowTooltipSingle}
            style={{
              textAlign:
                showFlowTooltip.value21 === undefined ? 'center' : 'left',
            }}
          >
            <div className={style.flowTooltipTitle}>
              <img
                src={showFlowTooltip.logo1}
                alt={`${showFlowTooltip.chain1} logo`}
                width={20}
                height={20}
              />
              <div className={style.flowArrow}>
                <span className={style.flowArrowTip}></span>
              </div>
              <img
                src={showFlowTooltip.logo2}
                alt={`${showFlowTooltip.chain2} logo`}
                width={20}
                height={20}
              />
            </div>
            <div className={style.flowData}>
              <p className={style.value}>
                {formatShort(showFlowTooltip.value12, 1)}
              </p>
            </div>
          </div>
          {showFlowTooltip.value21 !== undefined && (
            <div className={style.flowTooltipSingle}>
              <div className={style.flowTooltipTitle}>
                <img
                  src={showFlowTooltip.logo2}
                  alt={`${showFlowTooltip.chain2} logo`}
                  width={20}
                  height={20}
                />
                <div className={style.flowArrow}>
                  <span className={style.flowArrowTip}></span>
                </div>
                <img
                  src={showFlowTooltip.logo1}
                  alt={`${showFlowTooltip.chain1} logo`}
                  width={20}
                  height={20}
                />
              </div>
              <div className={style.flowData}>
                <p className={style.value}>
                  {formatShort(showFlowTooltip.value21, 1)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      {showBridgeTooltip !== false && (
        <>
          <div className={style.flowTooltipTitle}>
            <img
              src={showBridgeTooltip.logo}
              alt={`${showBridgeTooltip.name} logo`}
              width={20}
              height={20}
            />
            <p>{showBridgeTooltip.name}</p>
            <p className={style.bridgeType}>{showBridgeTooltip.type}</p>
          </div>
          <div className={style.flowData}>
            <p>Value Bridged</p>
            <p className={style.value}>
              {formatShort(showBridgeTooltip.value, 1)}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
