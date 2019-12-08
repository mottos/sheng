import { CreateDateColumn } from 'typeorm';

export class BaseEntity {
  @CreateDateColumn({type: 'timestamp', default: 'now', comment: '创建时间'})
  createdTime!: number;

  @CreateDateColumn({type: 'timestamp', nullable: true, comment: '更新时间'})
  updatedTime?: number;
}
