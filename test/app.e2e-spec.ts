import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from './../src/app.module';

// Substitute ioredis completely with ioredis-mock for E2E
jest.mock('ioredis', () => require('ioredis-mock'));

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('Create and Get Event Flow (POST and GET asserting Pub/Sub)', async () => {
    // 1. Post an event
    const postRes = await request(app.getHttpServer())
      .post('/api/events')
      .send({ type: 'integration', payload: { foo: 'bar' } })
      .expect(201);
      
    const createdId = postRes.body.id;
    expect(createdId).toBeDefined();
    expect(postRes.body.type).toBe('integration');

    // Allow mock pub/sub events to process
    await new Promise(r => setTimeout(r, 100));

    // 2. Fetch the event
    const getRes = await request(app.getHttpServer())
      .get(`/api/events/${createdId}`)
      .expect(200);

    expect(getRes.body.id).toEqual(createdId);
    expect(getRes.body.type).toEqual('integration');
  });

  it('fails with 400 when omitting required fields', () => {
    return request(app.getHttpServer())
      .post('/api/events')
      .send({ type: 'bad' }) // Missing payload
      .expect(400);
  });
});
