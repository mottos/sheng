import 'reflect-metadata';
import { EntryPoint, Module, InjectLogger, Logger } from '@sensejs/core';
import { defaultLoggerBuilder, SenseLogModule } from '@sensejs/logger';
import { HttpModule } from './modules/http/http.module';

@EntryPoint({logger: defaultLoggerBuilder.build()})
class App extends Module({
  requires: [SenseLogModule, HttpModule],
}) {
  constructor(@InjectLogger(App) private logger: Logger) {
    super();
  }

  async onCreate() {
    this.logger.info('Sheng App is Creating...');
    await super.onCreate();
    this.logger.info('Sheng App is Created...');
  }

  async onDestroy() {
    this.logger.info('Sheng App is Destroying...');
    await super.onDestroy();
    this.logger.info('Sheng App is Destroyed...');
  }
}
