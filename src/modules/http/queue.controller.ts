import _ from 'lodash';
import { inject } from 'inversify';
import { InjectLogger, Logger } from '@sensejs/core';
import { Controller, GET, Path } from '@sensejs/http';
import { QueueService } from '../queue/queue.service';

@Controller('/api/queues')
export class QueueController {
  constructor(
    @InjectLogger(QueueController) private logger: Logger,
    @inject(QueueService) private readonly queueService: QueueService,
  ) {
  }

  @GET('/')
  async getQueues(): Promise<string[]> {
    this.logger.info('GetQueues starting.');
    const queues = await this.queueService.getQueues();
    return queues;
  }

  @GET('/:name')
  async getQueue(@Path('name') name: string): Promise<string[]> {
    this.logger.info('GetQueue starting.');
    const queue = await this.queueService.getQueue(name);
    return queue;
  }
}
