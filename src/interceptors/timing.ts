import {HttpInterceptor, HttpContext} from '@sensejs/http';
import {Component, InjectLogger, Logger} from '@sensejs/core';

@Component()
export class TimingInterceptor extends HttpInterceptor {
  constructor(@InjectLogger(TimingInterceptor) private logger: Logger) {
    super();
  }
  async intercept(context: HttpContext, next: () => Promise<void>): Promise<void> {
    const startDate = Date.now();
    this.logger.info('Request incoming');
    try {
      await next();
    } finally {
      this.logger.info('Response finished in %d ms', Date.now() - startDate);
    }
  }
}
