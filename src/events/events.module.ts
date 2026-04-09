import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsStore } from './events.store';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [ConfigModule, RedisModule],
  controllers: [EventsController],
  providers: [EventsService, EventsStore],
})
export class EventsModule {}
