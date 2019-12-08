import { resolve } from 'path';
import { InjectLogger, Logger } from '@sensejs/core';
import { TypeOrmModule as DefaultTypeOrmModule} from '@sensejs/typeorm';
import { ConfigModule } from '../config/config.module';

export class TypeOrmModule extends DefaultTypeOrmModule({
  requires: [ConfigModule],
  typeOrmOption: {
    entities: [resolve(__dirname, '..', '**/*.entity.*')],
  },
  injectOptionFrom: 'config.typeorm',
}) {
  constructor(@InjectLogger(TypeOrmModule) private logger: Logger) {
    super();
  }

  async onCreate() {
    this.logger.info('Sheng TypeOrmModule is Creating...');
    await super.onCreate();
    this.logger.info('Sheng TypeOrmModule is Created...');
  }

  async onDestroy() {
    this.logger.info('Sheng TypeOrmModule is Destroying...');
    await super.onDestroy();
    this.logger.info('Sheng TypeOrmModule is Destroyed...');
  }
}
