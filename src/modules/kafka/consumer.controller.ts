import { inject } from 'inversify';
import { InjectLogger, Logger } from '@sensejs/core';
import { SubscribeController, SubscribeTopic, Message, KafkaMessage } from '@sensejs/kafka';
import { ConsumerService } from './consumer.service';
import { WebhookDomainMessage, MerchantDomainMessage } from '../../constants/kafka';

@SubscribeController({interceptors: []})
export class DeviceEventSubsciber {
  constructor(
    @InjectLogger(DeviceEventSubsciber) private readonly logger: Logger,
    @inject(ConsumerService) private readonly consumerService: ConsumerService,
  ) {
  }

  @SubscribeTopic({injectOptionFrom: 'config.kafka.consumers.deviceUplink'})
  async handleDeviceEvent(@Message() message: KafkaMessage) {
    if (typeof message.value !== 'string') {
      message.value = message.value.toString();
    }
    const {topic, value} = message;
    this.logger.log('Debug: DeviceEventSubsciber -> handleDeviceEvent -> topic, value', topic, value);
    const kafkaMessage: WebhookDomainMessage = JSON.parse(value);
    const { data } = kafkaMessage;
    this.consumerService.deviceHandler(topic, data);
  }
}

@SubscribeController()
export class MerchantEventSubscriber {
  constructor(
    @InjectLogger(MerchantEventSubscriber) private readonly logger: Logger,
    @inject(ConsumerService) private readonly consumerService: ConsumerService,
  ) {
  }

  @SubscribeTopic({option: {consumeTimeout: 30000}, injectOptionFrom: 'config.kafka.consumers.merchantEvent'})
  async handleMerchantEvent(@Message() message: KafkaMessage) {
    if (typeof message.value !== 'string') {
      message.value = message.value.toString();
    }
    const {topic, value} = message;
    this.logger.log('Debug: DeviceEventSubsciber -> handleDeviceEvent -> topic, value', topic, value);
    const kafkaMessage: MerchantDomainMessage = JSON.parse(value);
    const { data } = kafkaMessage;
    this.consumerService.merchantHandler(topic, data);
  }
}
