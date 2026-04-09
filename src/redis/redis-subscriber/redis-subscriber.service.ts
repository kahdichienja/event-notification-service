import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisSubscriberService implements OnModuleInit, OnModuleDestroy {
  private subscriber: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.subscriber = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });

    this.subscriber.subscribe('events:created', (err) => {
      if (err) {
        console.error('Failed to subscribe to events:created', err);
      } else {
        console.log('Subscribed successfully to events:created');
      }
    });

    this.subscriber.on('message', (channel, message) => {
      if (channel === 'events:created') {
        process.stdout.write(
          `[RedisSubscriberService] Received message on events:created: ${message}\n`,
        );
      }
    });
  }

  onModuleDestroy() {
    this.subscriber.quit().catch(console.error);
  }
}
