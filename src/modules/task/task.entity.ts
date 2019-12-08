import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BucketType } from '../../constants/bucket';
import { BaseEntity } from '../../commons/base-entity';

@Entity()
export class Task extends BaseEntity {

  @PrimaryGeneratedColumn('uuid', {comment: '任务主键'})
  id!: string;

  @Column({type: 'varchar', comment: '任务订阅topic名称'})
  topic!: string;

  @Column({type: 'enum', enum: BucketType, comment: '任务类型'})
  type!: BucketType;

  @Column({type: 'int', comment: '延迟时长单位秒'})
  delay!: number;

  @Column({type: 'int', default: 30, comment: '任务执行超时时间单位秒'})
  ttr!: number;

  @Column({type: 'json', default: {}, comment: '任务内容元信息'})
  metadata!: object;
}
