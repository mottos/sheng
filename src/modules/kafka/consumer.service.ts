import _ from 'lodash';
import { IMasterMerchant } from './../../constants/common';
import { IMalfunctionRecord } from './../../constants/malfunction';
import { SelfcheckStatus, AlarmStatus, MalfunctionStatus, IStatus } from './../../constants/status';
import { ISensorDevice } from './../../constants/device';
import { InjectTraceId } from '@sensoro/sensejs';
import { ProducerService } from './producer.service';
import { DeviceService } from '../device/device.service';
import { Type } from '../../constants/device';
import { SensorProcessor } from '../processor/processor.service';
import { inject, Container } from 'inversify';
import { InjectRedis } from '@sensejs/redis';
import { Redis } from 'ioredis';
import { InjectLogger, Logger, Component } from '@sensejs/core';
import { ConsumerTopicNames, IESLog } from '../../constants/kafka';
import { IWebhook, IWebhookData } from '../../constants/webhook';
import { DeviceFactoryService } from '../factory/device-factory.service';
import { BaseDevice } from '../factory/devices';
import { IAlarmRecord } from '../../constants/alarm';
import { SensorType } from '../../constants/sensor';
import { MerchantService } from '../merchant/merchant.service';
import { MicrospotService } from '../microspot/microspot.service';

@Component()
export class ConsumerService {
  constructor(
    @InjectTraceId() private readonly traceId: string,
    @InjectRedis('locker') private readonly lockRedis: Redis,
    @InjectRedis('cacher') private readonly cacheRedis: Redis,
    @InjectLogger(ConsumerService) private readonly logger: Logger,
    @inject('config.multiPacket') private multiPacket: string[],
    @inject(ProducerService) private readonly producer: ProducerService,
    @inject(DeviceService) private readonly deviceService: DeviceService,
    @inject(MerchantService) private readonly merchantService: MerchantService,
    @inject(SensorProcessor) private readonly sensorProcessor: SensorProcessor,
    @inject(MicrospotService) private readonly microspotService: MicrospotService,
    @inject(DeviceFactoryService) private readonly deviceFactory: DeviceFactoryService,
    @inject(Container) private readonly container: Container,
  ) {
  }

  async applyLock(lockKey: string): Promise<boolean> {
    const flag = await this.lockRedis.set(lockKey, 1, 'ex', 60, 'nx');
    return !!flag;
  }

  async clearLock(lockKey: string): Promise<any> {
    const flag = await this.lockRedis.del(lockKey);
    return !!flag;
  }

  // 延迟抖动处理
  async debounceMsg(data: IWebhookData): Promise<boolean> {
    const { sn, msgId, createdTime } = data;
    const snKey = `up:sortedset:${sn}`;
    const snMessageId = `${sn}-${msgId}`;
    const [latestMsgId, latestMsgTime] = await this.cacheRedis.zrange(snKey, -1, -1, 'WITHSCORES');
    if (createdTime < Number(latestMsgTime)) {
      this.logger.warn(`[debounceMsg] ${snMessageId} 晚于最新消息 ${latestMsgId} 将被抛弃, 时间对比: ${createdTime} < ${latestMsgTime}`);
      return true;
    }
    if (createdTime) {
      await this.cacheRedis.zadd(snKey, String(createdTime), msgId);
    }
    return false;
  }

  async merchantHandler(topic: string, merchant: IMasterMerchant): Promise<boolean> {
    let result: boolean = false;
    const beginMessage = `Receive Message from topic${topic}`;
    const endMessage = `Finish processing message from topic ${topic}`;
    switch (topic) {
      case ConsumerTopicNames.merchantEvent:
        this.microspotService.beginMeasure(beginMessage);
        this.logger.info(`[upstreamMsg] get original message: ${JSON.stringify(merchant)}`);
        result = await this.merchantService.createMerchant(merchant);
        this.microspotService.endMeasure(endMessage);
        break;
      default:
        this.logger.error(`[merchantHandler] topic ${topic} no support`);
        break;
    }
    return result;
  }

  async deviceHandler(topic: string, data: IWebhook): Promise<boolean> {
    let result: boolean = false;
    const beginMessage = `Receive Message from topic${topic}`;
    const endMessage = `Finish processing message from topic ${topic}`;
    switch (topic) {
      case ConsumerTopicNames.deviceUplink:
        this.microspotService.beginMeasure(beginMessage);
        this.logger.info(`[upstreamMsg] get original message: ${JSON.stringify(data)}`);
        result = await this.sensorMessage(data);
        this.microspotService.endMeasure(endMessage);
        break;
      default:
        this.logger.error(`[deviceHandler] topic ${topic} no support`);
        break;
    }
    return result;
  }

  // async sensorMsg(data: IWebhook, traceId: string): Promise<SensorProcessResult> {
  //   const { merchant, webhook } = data;
  //   const type: Type = webhook.deviceType;
  //   // 针对SM-7、SM-10、SM-11烟感设备走新流程
  //   if (this.multiPacket.includes(type)) {
  //     return this.smokeSensorMsg(data, traceId);
  //   }
  //   const deviceInfo = await this.deviceService.getCache(sensorProcessor.deviceMessage.sn);
  //   logger.info(`[upstreamMsg] SN(${sensorProcessor.deviceMessage.sn}) deviceInfo: %j`, deviceInfo);
  //   const { isNewDevice, newSource, isChangedOfAppId } = sensorProcessor.isNewDevice(deviceInfo);
  //   logger.info(`[upstreamMsg] SN(${sensorProcessor.deviceMessage.sn}) 新旧状态: ${isNewDevice}, 来自于: ${newSource}`);
  //   // 解析设备数据
  //   const device = sensorProcessor.sensorAnalyse(deviceInfo, isNewDevice);
  //   // 当 appId 发生变化或者不存在 owners 信息时更新owners，防止分配给子商户的未激活设备在初次数据上行时被退回给经销商
  //   if (isChangedOfAppId || !deviceInfo.owners) {
  //     device.owners = sensorProcessor.appInfo._id;
  //   }
  //   const result = await this.deviceService.updateDeviceStats(device.sn);
  //   logger.info(`[upstreamMsg] SN(${sensorProcessor.deviceMessage.sn}) 更新设备状态结果: ${JSON.stringify(result)}`);

  //   // 设置设置失联
  //   await this.deviceService.setDeviceOfflineTime(device);
  //   await this.deviceService.updateInterval(device.sn, device.interval);

  //   // 检查设备数据是否合法
  //   const isSensoroDataOk = DeviceService.isSensorDataOk(device);
  //   // 记录统计数据
  //   const cityRedis = this.redisService.getClient(REDIS_NAMES.city);
  //   await DeviceService.setDataStatistics(cityRedis, device.sn, device.deviceType, isSensoroDataOk);
  //   if (!isSensoroDataOk) {
  //     // 数据无效后应将此设备按原有数据置为在线状态
  //     const status = await this.deviceService.updateStatusOnly(
  //       device.sn,
  //       deviceInfo.alarmStatus,
  //       deviceInfo.malfunctionStatus,
  //       Boolean(device.errorInsulateSwitch),
  //     );
  //     device.status = status;
  //     // 对于安科瑞断电上行的第一个包含阈值的无效包需要更新阈值
  //     if (OnlyUpdateThresholdDeviceType.includes(device.deviceType)) {
  //       this.deviceService.updateOne(device.sn, {alarms: device.alarms}, isNewDevice);
  //       return { device, deviceInfo };
  //     }
  //     if (!isNewDevice && deviceInfo.deployFlag) {
  //       this.rpcService.rpcEmitStatusChange(device, deviceInfo.owners, deviceInfo.status, sensorProcessor.appInfo.appId, deviceInfo.appId);
  //     }
  //     logger.info(
  //       `[upstreamMsg] SN(${device.sn}) 此次接收的为无效数据, sensorTypes: ${JSON.stringify(device.sensorTypes)},` +
  //       ` sensoroData: ${JSON.stringify(device.sensorData)}, 只更新设备运行状态, 是否新设备: ${isNewDevice}`,
  //     );
  //     delete device.sensorData;
  //     delete device.sensorTypes;
  //     return { device, deviceInfo };
  //   }
  //   // 有效数据防抖处理
  //   const isBounced = await this.debounceMsg(json);
  //   if (isBounced) {
  //     return { device, deviceInfo };
  //   }
  //   // 写ES日志
  //   const isOldSelfCheck = _.get(device.sensorData, 'smoke') === 2;
  //   const isSelfCheck = !!_.get(sensorProcessor.deviceMessage, 'metaData.selfCheck', isOldSelfCheck);
  //   device.selfCheckStatus = isSelfCheck;
  //   if (isSelfCheck) {
  //     logger.info('[upstreamMsg] SN :: %s 该设备正在进行自检', device.sn);
  //     // 手动整理数据以适应自检时同时更新数据的需求
  //     device.sensorData = DeviceService.resetSensorField(device.sensorData);
  //   }
  //   this.rpcService.rpcElasticLog(device, isSelfCheck, deviceInfo.interval);
  //   // 判断设备的故障状态
  //   const { malfunctionStatus, malfunctionRecords } = sensorProcessor.malfunctionVerify();
  //   device.malfunctionStatus = malfunctionStatus;
  //   device.malfunctionRecords = malfunctionRecords;
  //   // 判断设备的预警状态，可根据
  //   const { alarmStatus, alarmsRecords, hitsRecords } = sensorProcessor.alarmVerify(device);
  //   device.alarmStatus = alarmStatus;
  //   device.alarmsRecords = alarmsRecords;
  //   device.hitsRecords = hitsRecords;
  //   // 只对已进行部署的有效设备应用‘报警’和‘故障’等附加业务，否则作为‘未投入使用的设备’保持‘正常’即可
  //   if (deviceInfo.deployFlag) {
  //     device.status = DeviceService.deviceStatusAnalyse(alarmStatus, malfunctionStatus, Boolean(device.errorInsulateSwitch));
  //     // 仅为已部署的设备推送状态的变化
  //     this.rpcService.rpcEmitStatusChange(
  //       device,
  //       deviceInfo.owners,
  //       deviceInfo.status,
  //       sensorProcessor.appInfo.appId,
  //       deviceInfo.appId,
  //     );
  //   }
  //   const newDevice = await this.deviceService.updateDeviceOfUpstream(device, isNewDevice);
  //   // 发送预警消息时携带报警屏蔽状态，在后续处理预警记录和发送短信等通知会使用
  //   newDevice.alarmShieldStatus = Boolean(_.get(sensorProcessor.deviceMessage, 'metaData.alarmShieldStatus'));
  //   // 报警屏蔽操作记录到变更记录
  //   this.deviceService.handleAlarmShield(device, _.get(sensorProcessor.deviceMessage, 'metaData.operation.alarmShield'));
  //   // 上行数据中如果是故障隔离状态变化，则发送短信告知用户，并终止后续操作
  //   this.deviceService.handleErrorInsulateSwitch(device, deviceInfo);

  //   // cayman特有逻辑
  //   if (device.deviceType === 'cayman_next') {
  //     // 本地操作过消音，记录到变更记录里面
  //     if (_.get(sensorProcessor.deviceMessage, 'metaData.operation.mute')) {
  //       this.deviceService.handleLocalMute(device);
  //     }
  //     // 自检下行服务状态到设备，只针对于cayman_next
  //     if (_.get(sensorProcessor.deviceMessage, 'metaData.selfCheck')) {
  //       this.deviceService.handleSelfCheck(device, deviceInfo);
  //     }
  //   }
  //   const malfunctionStatusChanged = DeviceService.malfunctionsCompare(device.malfunctionRecords, deviceInfo.malfunctionRecords);
  //   const recordsStatusChanged = DeviceService.alarmsStatusCompare(device.alarmsRecords, deviceInfo.alarmsRecords);
  //   const alarmBody = {
  //     device: newDevice,
  //     deviceInfo,
  //     isSelfCheck,
  //     malfunctionStatusChanged,
  //     recordsStatusChanged,
  //   };
  //   const msgId = sensorProcessor.deviceMessage.msgId;
  //   logger.info(`[upstreamMsg] SN(${device.sn})-MsgId(${msgId}) iot上行信息处理结果: ${JSON.stringify(alarmBody)}`);
  //   if (deviceInfo.deployFlag) {
  //     // 触发失联逻辑
  //     if (deviceInfo.status === DeviceStatus.disconnect) {
  //       logger.info(`sn:: %s status:: %s 触发失联逻辑`, device.sn, deviceInfo.status);
  //       this.rpcService.rpcDeviceLostSignal(Object.assign({}, newDevice));
  //     }
  //     await this.deviceService.pushAlarm(newDevice, recordsStatusChanged, malfunctionStatusChanged, this.traceId);
  //   }
  //   this.rpcService.rpcDirtyAlarm(alarmBody);
  //   // 统计分析
  //   await this.deviceService.pushAggregate(newDevice, deviceInfo, this.traceId);
  //   await sensorProcessor.removeSnMessage();
  //   return alarmBody;
  // }

  async sensorMessage(webhook: IWebhook): Promise<boolean> {
    this.logger.info(`[upstreamMsg] get original webhook: ${JSON.stringify(webhook)}`);
    // 解析消息体，通过工厂返回不同type的统一device
    const device: BaseDevice = this.deviceFactory.buildDevice(webhook);
    if (_.isEmpty(device)) {
      this.logger.warn(`设备类型不支持: ${device.type}`);
      return false;
    }
    const {sn, merchant, webhookData} = device;
    // 通过sn在缓存获取设备详情
    const deviceInfo: ISensorDevice = await this.deviceService.getCache(sn);
    this.logger.info(`[upstreamMsg] SN(${sn}) deviceInfo: %j`, deviceInfo);
    // 判断设备是否为新设备
    const isRenewed = device.isRenewed(deviceInfo);
    this.logger.info(`[upstreamMsg] SN(${sn}) 新旧状态: ${isRenewed}`);
    // 分析上行数据
    this.sensorProcessor.setDevices(deviceInfo, webhookData);
    const sensorDevice: ISensorDevice = this.sensorProcessor.analyse();
    const {sensorData, sensorTypes = [], lnglat, interval, statuses, updatedTime} = sensorDevice;
    // 判断设备离线逻辑
    const isOffline = device.isOffline(deviceInfo);
    if (isOffline) {
      this.logger.info(`sn:: %s status:: %s 触发离线逻辑`, device.sn, isOffline);
      // todo 离线逻辑待处理
    }
    //  检验merchantId触发商户更新
    const isExchanged = device.isExchanged(deviceInfo);
    if (isExchanged || !deviceInfo.merchantId) {
      sensorDevice.merchantId = merchant.merchantId;
    }
    //  设置网络状态信息
    await this.deviceService.setDeviceOfflineTime(deviceInfo);
    // 有效数据防抖处理
    const isBounced = await this.debounceMsg(webhookData);
    if (isBounced) {
      return false;
    }
    // 判断设备故障逻辑，填充所需状态
    const isMalfunctioned = device.isMalfunctioned();
    if (isMalfunctioned) {
      statuses.malfunctionStatus = MalfunctionStatus.malfunction;
      sensorDevice.malfunctionRecords = device.getMalfunctionRecords() || [];
    }
    // 判断设备预警逻辑，填充所需状态
    const isAlarmed = device.isAlarmed(sensorDevice);
    if (isAlarmed) {
      statuses.alarmStatus = AlarmStatus.alarm;
      sensorDevice.alarmRecords = device.getAlarmRecords(sensorDevice) || [];
    }
    // 校验设备部署状态，未部署设备保持不变
    const isDeployed = device.isDeployed(deviceInfo);
    // 检查预警故障变动
    const reducedAlarms = this.sensorProcessor.reduce<IAlarmRecord>(sensorDevice.alarmRecords || []);
    const reducedMalfunctions = this.sensorProcessor.reduce<IMalfunctionRecord>(sensorDevice.malfunctionRecords || []);
    // 生产Kafka预警消息(已部署)，追加故障状态变更标志+告警记录状态变更
    this.logger.info(`[upstreamMsg] SN(${sn}) iot上行信息处理结果: ${JSON.stringify(sensorDevice)}`);
    await this.deviceService.updateDeviceAndCleanCache(sensorDevice, isRenewed);
    const newDevice: ISensorDevice = await this.deviceService.getCache(sn);
    // 是否自检逻辑，sensorData是否有效，以及写ES日志
    this.logger.info('[upstreamMsg] SN :: %s 该设备是否正在进行自检', device.sn, statuses.selfcheckStatus);
    const sensorDataValid = _.some(_.keys(sensorData || {}), (item: SensorType) => sensorTypes.includes(item));
    if (sensorDataValid) {
      const esLog: IESLog = {
        sn, lnglat, interval, sensorData, updatedTime,
        selfcheckStaus: statuses.selfcheckStatus,
        appId: merchant.appId, msgId: webhookData.msgId,
      };
      this.producer.publishESLogEvent(esLog, this.traceId);
    }
    if (isDeployed) {
      // 预警事件: 是否有预警或恢复
      if (!_.isEmpty(reducedAlarms)) {
        await this.producer.publishAlarmedEvent(newDevice, this.traceId);
      }
      // 故障事件: 是否有故障或恢复
      if (!_.isEmpty(reducedMalfunctions)) {
        await this.producer.publishMalfunctionedEvent(newDevice, this.traceId);
      }
      // 统计分析: 是否推送新建消息
      if (!deviceInfo.sn) {
        await this.producer.publishCreatedEvent(newDevice, this.traceId);
      }
      // 统计分析: 推送上行消息给数据同步action
      await this.producer.publishDataSyncedEvent(newDevice, this.traceId);
      // 统计分析: 推送上行消息给数据变化action
      await this.producer.publishDataChangedEvent(newDevice, this.traceId);
      // 统计分析: 推送上行消息给属性变化action
      const newer: any = _.assign({hide: 'hidden'}, sensorDevice);
      const older: any = _.assign({hide: 'hidden'}, deviceInfo);
      const metric: string[] = _.keys(sensorDevice).filter((s: string) => !_.isEqual(newer[s], older[s]));
      if (!_.isEmpty(metric)) {
        await this.producer.publishPropertyChangedEvent(sensorDevice, metric, this.traceId);
      }
    }
    return true;
  }
}
