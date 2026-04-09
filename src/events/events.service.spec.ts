/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventsService } from './events.service';
import { EventsStore } from './events.store';
import { RedisPublisherService } from '../redis/redis-publisher/redis-publisher.service';
import { NotFoundException } from '@nestjs/common';

describe('EventsService', () => {
  let service: EventsService;
  let store: EventsStore;
  let redisPublisher: RedisPublisherService;

  beforeEach(async () => {
    // Creating Mock Instances
    const mockRedisPublisher = {
      publishMessage: jest.fn(),
      getCache: jest.fn(),
      setCache: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key, def) => def),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        EventsStore,
        { provide: RedisPublisherService, useValue: mockRedisPublisher },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    store = module.get<EventsStore>(EventsStore);
    redisPublisher = module.get<RedisPublisherService>(RedisPublisherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEvent', () => {
    it('should save to store and publish to redis', async () => {
      const storeSpy = jest.spyOn(store, 'save');
      const eventDto = { type: 'test', payload: { a: 1 } };

      const result = await service.createEvent(eventDto);

      expect(result.id).toBeDefined();
      expect(result.type).toBe('test');
      expect(storeSpy).toHaveBeenCalledWith(result);
      expect(redisPublisher.publishMessage).toHaveBeenCalledWith(
        'events:created',
        JSON.stringify(result),
      );
    });
  });

  describe('getEvent', () => {
    it('should return from cache if present', async () => {
      const cachedEvent = {
        id: 'uuid-1',
        type: 'test',
        payload: {},
        createdAt: 'date',
      };
      (redisPublisher.getCache as jest.Mock).mockResolvedValue(
        JSON.stringify(cachedEvent),
      );

      const result = await service.getEvent('uuid-1');
      expect(result).toEqual(cachedEvent);

      // Validate store wasn't called
      const storeSpy = jest.spyOn(store, 'findById');
      expect(storeSpy).not.toHaveBeenCalled();
    });

    it('should return from store and cache it if not in cache', async () => {
      (redisPublisher.getCache as jest.Mock).mockResolvedValue(null);
      const storedEvent = {
        id: 'uuid-2',
        type: 'test',
        payload: {},
        createdAt: 'date',
      };
      store.save(storedEvent); // Prefill store

      const result = await service.getEvent('uuid-2');
      expect(result).toEqual(storedEvent);
      expect(redisPublisher.setCache).toHaveBeenCalledWith(
        'event:uuid-2',
        JSON.stringify(storedEvent),
        60, // default TTL mock
      );
    });

    it('should throw NotFoundException if missing from cache and store', async () => {
      (redisPublisher.getCache as jest.Mock).mockResolvedValue(null);

      await expect(service.getEvent('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
