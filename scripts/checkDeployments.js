(async () => {
  const fetch = (await import('node-fetch')).default;
  const { kv } = require('@vercel/kv');

  const regexPattern = process.env.ASSET_HASH_REGEX || '/_next/static/[^"]+';

  async function checkDeployments() {
    try {
      // Fetch the list of websites from Vercel KV
      const websites = await kv.get('websites');
      const websitesList = typeof websites === 'string' ? JSON.parse(websites) : websites;

      for (const website of websitesList) {
        const response = await fetch(website.url);
        const text = await response.text();

        // Extract asset hashes from the HTML content
        const assetHashes = extractAssetHashes(text);

        // Compare with previously stored hashes
        const previousHashes = await kv.get(`hashes:${website.url}`);
        const previousHashesList = typeof previousHashes === 'string' ? JSON.parse(previousHashes) : previousHashes || [];
        const newDeployments = assetHashes.filter(hash => !previousHashesList.includes(hash));

        if (newDeployments.length > 0) {
          // Update stored hashes and log the deployment event
          await kv.set(`hashes:${website.url}`, JSON.stringify(assetHashes));
          await logDeploymentEvent(website.url, newDeployments);
        }
      }
    } catch (error) {
      console.error('Error checking deployments:', error);
    }
  }

  function extractAssetHashes(html) {
    try {
      const regex = new RegExp(regexPattern, 'g');
      const matches = html.match(regex);
      return matches ? matches.map(match => match.split('/').pop()) : [];
    } catch (error) {
      console.error('Invalid regex pattern:', error);
      return [];
    }
  }

  async function logDeploymentEvent(url, newDeployments) {
    const timestamp = new Date().toISOString().split('T')[0]; // Extract only the date part
    const events = await kv.get('deploymentEvents');
    const eventsList = typeof events === 'string' ? JSON.parse(events) : events || [];

    // Find the event for the current date
    let event = eventsList.find(event => event.date === timestamp);

    if (!event) {
      // If no event exists for the current date, create a new one
      event = { date: timestamp, deployments: 0 };
      eventsList.push(event);
    }

    // Increment the deployment count for the current date
    event.deployments += newDeployments.length;

    await kv.set('deploymentEvents', JSON.stringify(eventsList));
  }

  checkDeployments();
})();
