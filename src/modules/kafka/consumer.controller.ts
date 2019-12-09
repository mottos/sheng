import { inject } from 'inversify';
import { InjectLogger, Logger } from '@sensejs/core';
import { SubscribeController, SubscribeTopic, Message, KafkaMessage } from '@sensejs/kafka';
import { ConsumerService } from './consumer.service';
import { TaskDomainMessage } from '../../constants/kafka';

@SubscribeController({interceptors: []})
export class TaskEventSubscriber {
  constructor(
    @InjectLogger(TaskEventSubscriber) private readonly logger: Logger,
    @inject(ConsumerService) private readonly consumerService: ConsumerService,
  ) {
  }

  @SubscribeTopic({injectOptionFrom: 'config.kafka.consumers.delayQueue'})
  async handleTaskEvent(@Message() message: KafkaMessage) {
    if (typeof message.value !== 'string') {
      message.value = message.value.toString();
    }
    const {topic, value} = message;
    this.logger.log('Debug: TaskEventSubsciber -> handleTaskEvent -> topic, value', topic, value);
    const kafkaMessage: TaskDomainMessage = JSON.parse(value);
    const { data } = kafkaMessage;
    this.consumerService.taskHandler(topic, data);
  }
}
