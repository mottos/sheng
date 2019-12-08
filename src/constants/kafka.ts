import config from 'config';
import { ITask } from './task';

export const TOPIC_CONFIG_KEY = 'kafka';

const {producers, consumers} = config.get(TOPIC_CONFIG_KEY);

const ProducerTopicsMap = producers as { [idx: string]: any };
const ConsumerTopicsMap = consumers as { [idx: string]: any };

// tslint:disable-next-line:no-namespace
export namespace ProducerTopicNames {
  export const esLog = ProducerTopicsMap.esLog.topic;
  export const deviceEvent = ProducerTopicsMap.deviceEvent.topic;
  export const deviceAlarm = ProducerTopicsMap.deviceAlarm.topic;
  export const deviceUplink = ProducerTopicsMap.deviceUplink.topic;
  export const deviceMalfunction = ProducerTopicsMap.deviceMalfunction.topic;
}

// tslint:disable-next-line:no-namespace
export namespace ConsumerTopicNames {
  export const deviceUplink = ConsumerTopicsMap.deviceUplink.topic;
  export const merchantEvent = ConsumerTopicsMap.merchantEvent.topic;
}

export enum Action {
  execute = 'execute',
  remove = 'remove',
}

export interface IKafkaMessage<Data, ActionEnum> {
  // 领域事件
  action: ActionEnum;
  // 实体数据
  data: Data;
  // 消息发出时间
  timestamp: number;
  // 消息Id 去重使用
  messageId: string;
  // 链路追踪
  traceId: string;
}

export type TaskDomainMessage = IKafkaMessage<ITask, Action>;
