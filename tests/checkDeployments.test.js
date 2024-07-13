const fetch = require('node-fetch');
const { kv } = require('@vercel/kv');
const { checkDeployments, extractAssetHashes, logDeploymentEvent } = require('../scripts/checkDeployments');

jest.mock('node-fetch');
jest.mock('@vercel/kv');

describe('checkDeployments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect new deployments for Next.js sites', async () => {
    const mockHtml = `
      <html>
        <head>
          <script src="/_next/static/chunks/main-12345.js"></script>
          <script src="/_next/static/chunks/vendor-67890.js"></script>
        </head>
      </html>
    `;

    const mockWebsites = JSON.stringify([{ url: 'https://drew.tech' }]);
    const mockPreviousHashes = JSON.stringify(['main-12345.js']);
    const mockNewHashes = ['main-12345.js', 'vendor-67890.js'];

    kv.get.mockImplementation((key) => {
      if (key === 'websites') return Promise.resolve(mockWebsites);
      if (key === 'hashes:https://drew.tech') return Promise.resolve(mockPreviousHashes);
      return Promise.resolve(null);
    });

    fetch.mockResolvedValue({
      text: () => Promise.resolve(mockHtml),
    });

    await checkDeployments();

    expect(kv.set).toHaveBeenCalledWith('hashes:https://drew.tech', JSON.stringify(mockNewHashes));
    expect(kv.set).toHaveBeenCalledWith(
      'deploymentEvents',
      expect.stringContaining('https://drew.tech')
    );
  });

  it('should not log deployment event if no new assets are detected', async () => {
    const mockHtml = `
      <html>
        <head>
          <script src="/_next/static/chunks/main-12345.js"></script>
        </head>
      </html>
    `;

    const mockWebsites = JSON.stringify([{ url: 'https://drew.tech' }]);
    const mockPreviousHashes = JSON.stringify(['main-12345.js']);
    const mockNewHashes = ['main-12345.js'];

    kv.get.mockImplementation((key) => {
      if (key === 'websites') return Promise.resolve(mockWebsites);
      if (key === 'hashes:https://drew.tech') return Promise.resolve(mockPreviousHashes);
      return Promise.resolve(null);
    });

    fetch.mockResolvedValue({
      text: () => Promise.resolve(mockHtml),
    });

    await checkDeployments();

    expect(kv.set).not.toHaveBeenCalledWith(
      'deploymentEvents',
      expect.stringContaining('https://drew.tech')
    );
  });
});

describe('extractAssetHashes', () => {
  it('should extract asset hashes from HTML content', () => {
    const mockHtml = `
      <html>
        <head>
          <script src="/_next/static/chunks/main-12345.js"></script>
          <script src="/_next/static/chunks/vendor-67890.js"></script>
        </head>
      </html>
    `;

    const expectedHashes = ['main-12345.js', 'vendor-67890.js'];
    const actualHashes = extractAssetHashes(mockHtml);

    expect(actualHashes).toEqual(expectedHashes);
  });
});

describe('logDeploymentEvent', () => {
  it('should log deployment event with correct data', async () => {
    const mockUrl = 'https://drew.tech';
    const mockNewDeployments = ['vendor-67890.js'];
    const mockTimestamp = new Date().toISOString();
    const mockEvent = { url: mockUrl, newDeployments: mockNewDeployments, timestamp: mockTimestamp };
    const mockEvents = JSON.stringify([mockEvent]);

    kv.get.mockResolvedValue(null);
    kv.set.mockResolvedValue();

    await logDeploymentEvent(mockUrl, mockNewDeployments);

    expect(kv.set).toHaveBeenCalledWith('deploymentEvents', mockEvents);
  });
});
