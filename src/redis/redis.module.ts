import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisPublisherService } from './redis-publisher/redis-publisher.service';
import { RedisSubscriberService } from './redis-subscriber/redis-subscriber.service';

@Module({
  imports: [ConfigModule],
  providers: [RedisPublisherService, RedisSubscriberService],
  exports: [RedisPublisherService],
})
export class RedisModule {}
