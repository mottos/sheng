import JWT from 'jsonwebtoken';
import { inject } from 'inversify';
import { HttpContext, HttpInterceptor, Header } from '@sensejs/http';
import { Component, InjectLogger, Logger } from '@sensejs/core';
import { IEncrypt } from '../constants/common';

@Component()
export class AuthzInterceptor extends HttpInterceptor {
  constructor(
    @InjectLogger(AuthzInterceptor) private logger: Logger,
    @inject('config.encrypt') private encrypt: IEncrypt,
  ) {
    super();
  }

  async intercept(context: HttpContext, next: () => Promise<void>): Promise<void> {
    const startDate = Date.now();
    try {
      const token = context.request.headers.authorization;
      this.logger.info('Authorization starting.');
      if (token) {
        const {secret, algorithm} = this.encrypt;
        const grants: any = JWT.verify(token, secret, {algorithms: [algorithm]});
        const isAllowed: boolean = typeof grants === 'string' ? false : grants.isAllowed;
        if (!isAllowed) {
          throw new Error('Authorization failure.');
        }
        await next();
      }
      await next();
    } finally {
      this.logger.info('Authorization or Signature finished in %d ms.', Date.now() - startDate);
    }
  }
}
