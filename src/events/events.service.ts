import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventsStore, AppEvent } from './events.store';
import { CreateEventDto } from './dto/create-event.dto';
import { RedisPublisherService } from '../redis/redis-publisher/redis-publisher.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventsService {
  constructor(
    private eventsStore: EventsStore,
    private redisPublisher: RedisPublisherService,
    private configService: ConfigService,
  ) {}

  async createEvent(createEventDto: CreateEventDto): Promise<AppEvent> {
    const event: AppEvent = {
      id: uuidv4(),
      type: createEventDto.type,
      payload: createEventDto.payload,
      createdAt: new Date().toISOString(),
    };

    // 1. Maintain in-memory store
    this.eventsStore.save(event);

    // 2. Publish to Redis channel
    await this.redisPublisher.publishMessage(
      'events:created',
      JSON.stringify(event),
    );

    return event;
  }

  async getEvent(id: string): Promise<AppEvent> {
    // 1. Check Redis cache
    const cached = await this.redisPublisher.getCache(`event:${id}`);
    if (cached) {
      return JSON.parse(cached) as AppEvent;
    }

    // 2. Fetch from store
    const event = this.eventsStore.findById(id);
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // 3. Cache it
    const ttl = this.configService.get<number>('CACHE_TTL_SECONDS', 60);
    await this.redisPublisher.setCache(`event:${id}`, JSON.stringify(event), ttl);

    return event;
  }
}
