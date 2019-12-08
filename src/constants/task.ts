import { BucketType } from './bucket';

export interface ITask {
  id?: string;
  topic: string;
  type: BucketType;
  delay: number;
  ttr?: number;
  metadata: object;
}
