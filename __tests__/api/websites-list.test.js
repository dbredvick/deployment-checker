import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/websites-list';

describe('/api/websites-list API Endpoint', () => {
  it('should return the list of websites including drew.tech', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toEqual(expect.arrayContaining([{ url: 'https://drew.tech' }]));
  });

  it('should return a 405 status code for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data).toEqual({ message: 'Method not allowed' });
  });
});
