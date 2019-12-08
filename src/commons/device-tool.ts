import _ from 'lodash';
import { SensorType } from '../constants/sensor';
import { AlarmStatus } from '../constants/status';
import { IWebhookData } from '../constants/webhook';
import { Switch, ISwitch } from '../constants/common';
import { IAlarmRule, AlarmRuleCondition, XAlarmRule } from '../constants/alarm';

// tslint:disable-next-line:no-namespace
export namespace DeviceTool {
  // 计算离线时间
  export function calcOfflineTime(interval: number): number {
    // 定义离线时间参数(周期大于 标准周期(5分钟) 的, 超过 标准倍数(5) 周期未收到则为离线,小于等于标准周期的超过 标准延时 未收到定义离线)
    const CONFIG = {
      // 设备周期<interval>未超过<cycle>的设备，离线时间为<default>
      standard: 30 * 60,
      // 标准周期 (秒)，对离线区分处理的临界值为5分钟
      critical: 5 * 60,
      // 设备周期<interval>超过<cycle>的设备，离线时间为<interval>的<times>倍
      times: 5,
    };
    let offlineTime = CONFIG.standard;
    // 周期存在大于标准周期
    if (interval && interval > CONFIG.critical) {
      offlineTime = interval * CONFIG.times;
    }
    return offlineTime + _.random(60, false);
  }

  // 预警规则合并
  export function mergeRule(rules: IAlarmRule[]): Map<SensorType, XAlarmRule> {
    const map = new Map<SensorType, XAlarmRule>();
    for (const rule of rules) {
      const {sensorType, condition, threshold} = rule;
      const xrule: XAlarmRule = map.get(sensorType) || {} as XAlarmRule;
      if (condition === AlarmRuleCondition.gt) {
        xrule.highLimit = threshold;
      } else if (condition === AlarmRuleCondition.lt) {
        xrule.lowLimit = threshold;
      }
      map.set(sensorType, xrule);
    }
    return map;
  }

  // 故障检验工具
  export function supportErrorType(webhookData: IWebhookData): string[] {
    let supportTypes = [];
    const metaData = webhookData.metaData || {};
    if (metaData.error) {
      const errorTypes = metaData.error.error_type || [];
      if (Array.isArray(errorTypes) && errorTypes.length) {
        // 过滤支持的故障类型
        supportTypes = errorTypes.filter((type) => String(type));
      }
    }
    return supportTypes;
  }

  // 开关校验器
  export function switchVerifier(switches: ISwitch, flag: boolean): AlarmStatus {
    let status: AlarmStatus = AlarmStatus.normal;
    const sw = Switch.alarmShielded;
    if (!_.isEmpty(switches)) {
      if (flag && switches[sw]) {
        status = AlarmStatus.alarm;
      }
    }
    return status;
  }

  // 数值校验器
  export function numberVerifier(rule: any, value: number): AlarmStatus {
    let status = AlarmStatus.normal;
    if (rule) {
      const {highLimit, lowLimit} = rule;
      if (highLimit <= lowLimit) {
        if (value >= highLimit && value < lowLimit) {
          status = AlarmStatus.alarm;
        }
      } else if (highLimit >= lowLimit) {
        if (value >= highLimit || value < lowLimit) {
          status = AlarmStatus.alarm;
        }
      }
    }
    return status;
  }
}
