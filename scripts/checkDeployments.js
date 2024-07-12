const fetch = require('node-fetch');
const { kv } = require('@vercel/kv');

// Load environment variables
require('dotenv').config();

async function checkDeployments() {
  try {
    // Fetch the list of websites from Vercel KV
    const websites = JSON.parse(await kv.get('websites'));

    for (const website of websites) {
      const response = await fetch(website.url);
      const text = await response.text();

      // Extract asset hashes from the HTML content
      const assetHashes = extractAssetHashes(text);

      // Compare with previously stored hashes
      const previousHashes = JSON.parse(await kv.get(`hashes:${website.url}`)) || [];
      const newDeployments = assetHashes.filter(hash => !previousHashes.includes(hash));

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
  const regex = /\/_next\/static\/[^"]+/g;
  const matches = html.match(regex);
  return matches ? matches.map(match => match.split('/').pop()) : [];
}

async function logDeploymentEvent(url, newDeployments) {
  const timestamp = new Date().toISOString();
  const event = { url, newDeployments, timestamp };
  const events = JSON.parse(await kv.get('deploymentEvents')) || [];
  events.push(event);
  await kv.set('deploymentEvents', JSON.stringify(events));
}

checkDeployments();
