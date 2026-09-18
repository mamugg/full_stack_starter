import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { validationExceptionFactory } from '../src/common/validation-exception.factory';

/**
 * Integration tests hosted in-memory (Nest's own TestingModule, no separate
 * process) — mirrors ApiWebApplicationFactory from the .NET test suite.
 * The login route is rate-limited (5 req/min, see AuthController), so the
 * admin token is fetched once and reused across every test.
 */
describe('API (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, exceptionFactory: validationExceptionFactory }),
    );
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin123!' });
    adminToken = response.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth', () => {
    it('POST /login with valid credentials returns a token and the role', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'user', password: 'User123!' });

      expect(response.status).toBe(200);
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
      expect(response.body.role).toBe('User');
    });

    it('POST /login with wrong password returns 401', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong-password' });

      expect(response.status).toBe(401);
    });

    it('POST /login with missing fields returns 400 with a validation envelope', async () => {
      const response = await request(app.getHttpServer()).post('/api/auth/login').send({ username: '' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('GET /me without a token returns 401', async () => {
      const response = await request(app.getHttpServer()).get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('GET /me with a valid token returns the admin username', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('admin');
    });
  });

  describe('/api/todoitems', () => {
    it('GET / without a token returns 401', async () => {
      const response = await request(app.getHttpServer()).get('/api/todoitems');

      expect(response.status).toBe(401);
    });

    it('POST / with an empty title returns 400', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/todoitems')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '' });

      expect(response.status).toBe(400);
    });

    it('POST / then GET /:id returns the created item', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/todoitems')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: "Ecrire des tests d'integration" });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.id).toBeGreaterThan(0);

      const getResponse = await request(app.getHttpServer())
        .get(`/api/todoitems/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.title).toBe(createResponse.body.title);
    });

    it('PUT /:id then DELETE /:id round-trips correctly', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/todoitems')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Tache a mettre a jour' });
      const id = createResponse.body.id;

      const updateResponse = await request(app.getHttpServer())
        .put(`/api/todoitems/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Tache mise a jour', isDone: true });
      expect(updateResponse.status).toBe(204);

      const getResponse = await request(app.getHttpServer())
        .get(`/api/todoitems/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getResponse.body.isDone).toBe(true);
      expect(getResponse.body.title).toBe('Tache mise a jour');

      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/todoitems/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteResponse.status).toBe(204);

      const getAfterDelete = await request(app.getHttpServer())
        .get(`/api/todoitems/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getAfterDelete.status).toBe(404);
    });

    it('GET /:id with an unknown id returns 404', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/todoitems/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('/api/external', () => {
    // GET /posts itself proxies the real jsonplaceholder.typicode.com and is
    // intentionally not covered here to keep the suite hermetic (no network
    // dependency) — same scope as the .NET test suite, which has no
    // ExternalController tests either.
    it('GET /posts/:id/with-comments without a token returns 401', async () => {
      const response = await request(app.getHttpServer()).get('/api/external/posts/1/with-comments');

      expect(response.status).toBe(401);
    });
  });
});
