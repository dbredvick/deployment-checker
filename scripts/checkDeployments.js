const fetch = require('node-fetch');
const redis = require('redis');
const { promisify } = require('util');

// Load environment variables
require('dotenv').config();

const client = redis.createClient({
  url: process.env.KV_URL,
  password: process.env.KV_REST_API_TOKEN,
});

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

async function checkDeployments() {
  try {
    // Fetch the list of websites from Redis
    const websites = JSON.parse(await getAsync('websites'));

    for (const website of websites) {
      const response = await fetch(website.url);
      const text = await response.text();

      // Extract asset hashes from the HTML content
      const assetHashes = extractAssetHashes(text);

      // Compare with previously stored hashes
      const previousHashes = JSON.parse(await getAsync(`hashes:${website.url}`)) || [];
      const newDeployments = assetHashes.filter(hash => !previousHashes.includes(hash));

      if (newDeployments.length > 0) {
        // Update stored hashes and log the deployment event
        await setAsync(`hashes:${website.url}`, JSON.stringify(assetHashes));
        await logDeploymentEvent(website.url, newDeployments);
      }
    }
  } catch (error) {
    console.error('Error checking deployments:', error);
  } finally {
    client.quit();
  }
}

function extractAssetHashes(html) {
  const regex = /\/_next\/static\/[^"]+/g;
  const matches = html.match(regex);
  return matches ? matches.map(match => match.split('/').pop()) : [];
}

async function logDeploymentEvent(url, newDeployments) {
  const timestamp = new Date().toISOString();
  const event = { url, newDeployments, timestamp };
  const events = JSON.parse(await getAsync('deploymentEvents')) || [];
  events.push(event);
  await setAsync('deploymentEvents', JSON.stringify(events));
}

checkDeployments();
