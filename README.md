### Sheng
![sheng](./sheng.icon) Sheng: A delay-queue middleware based on Redis & Kafka.
参考 [有赞延迟队列设计](https://tech.youzan.com/queuing_delay/) 中的部分设计，优化后实现。

### 设计目标
- 消息传输可靠性：消息进入到延迟队列后，保证至少被消费一次。
- Client支持丰富：由于业务上的需求，至少支持PHP和Python。
- 高可用性：至少得支持多实例部署。挂掉一个实例后，还有后备实例继续提供服务。
- 实时性：允许存在一定的时间误差。
- 支持消息删除：业务使用方，可以随时删除指定消息。

### 整体结构
1. 整个延迟队列由4个部分组成：
- Job Pool用来存放所有Job的元信息。
- Delay Bucket是一组以时间为维度的有序队列，用来存放所有需要延迟的／已经被reserve的Job（这里只存放Job Id）。
- Timer负责实时扫描各个Bucket，并将delay时间大于等于当前时间的Job放入到对应的Ready Queue。
- Ready Queue存放处于Ready状态的Job（这里只存放Job Id），以供消费程序消费。

2. 如下图表述：
![](https://tech.youzan.com/content/images/2016/03/all-1.png)

### 设计要点
#### 基本概念
- Job：需要异步处理的任务，是延迟队列里的基本单元。与具体的Topic关联在一起。
- Topic：一组相同类型Job的集合（队列）。供消费者来订阅。

#### 消息结构
每个Job必须包含一下几个属性：

- Topic：Job类型。可以理解成具体的业务名称。
- Id：Job的唯一标识。用来检索和删除指定的Job信息。
- Delay：Job需要延迟的时间。单位：秒。（服务端会将其转换为绝对时间）
- TTR（time-to-run)：Job执行超时时间。单位：秒。
- Body：Job的内容，供消费者做具体的业务处理，以json格式存储。

具体结构如下图表示：

![Job Struct](https://tech.youzan.com/content/images/2016/03/job.png)

TTR的设计目的是为了保证消息传输的可靠性。

#### 消息状态转换
每个Job只会处于某一个状态下：

- ready：可执行状态，等待消费。
- delay：不可执行状态，等待时钟周期。
- reserved：已被消费者读取，但还未得到消费者的响应（delete、finish）。
- deleted：已被消费完成或者已被删除。

下面是四个状态的转换示意图：

![Job State Flow](https://tech.youzan.com/content/images/2016/03/job-state.png)

#### 消息存储
在选择存储介质之前，先来确定下具体的数据结构：

- Job Poll存放的Job元信息，只需要K/V形式的结构即可。key为job id，value为job struct。
- Delay Bucket是一个有序队列。
- Ready Queue是一个普通list或者队列都行。
