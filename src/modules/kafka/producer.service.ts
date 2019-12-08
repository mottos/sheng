import _ from 'lodash';
import uuid from 'uuid/v4';
import { inject } from 'inversify';
import { MessageProducer } from '@sensejs/kafka';
import { InjectLogger, Logger, Component } from '@sensejs/core';
import { ITask } from '../../constants/task';
import { Action, ProducerTopicNames, TaskDomainMessage } from '../../constants/kafka';

@Component()
export class ProducerService {
  constructor(
    @InjectLogger(ProducerService) private readonly logger: Logger,
    @inject(MessageProducer) private readonly producer: MessageProducer,
  ) {
  }

  publishExecutedTask(task: ITask) {
    const kafkaMessage: TaskDomainMessage = {
      traceId: uuid(),
      messageId: uuid(),
      timestamp: Date.now(),
      action: Action.execute,
      data: task,
    };
    this.logger.info(`[publishExecutedTask] ${task.id} 发送任务执行消息: ${JSON.stringify(kafkaMessage)}`);
    return this.producer.produceMessage(ProducerTopicNames.deviceEvent, JSON.stringify(kafkaMessage));
  }
}
