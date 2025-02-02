import { kv } from '@vercel/kv';
import { unstable_noStore } from 'next/cache';

const regexPattern = process.env.ASSET_HASH_REGEX || '/_next/static/[^"]+';

async function checkDeployments() {
  try {
    // Fetch the list of websites from Vercel KV
    const websites = await kv.get('websites');
    console.log('Fetched websites:', websites);

    for (const website of websites) {
      unstable_noStore()
      const response = await fetch(website.url);
      const text = await response.text();
      console.log(`Fetched HTML for ${website.url}`);

      // Extract asset hashes from the HTML content
      const assetHashes = extractAssetHashes(text);
      console.log(`Extracted asset hashes for ${website.url}:`, assetHashes);

      // Check if there is at least one new or changed hash
      const previousHashes = await kv.get(`hashes:${website.url}`) || [];
      const isRollover = assetHashes.some(hash => !previousHashes.includes(hash));
      console.log(`Deployment status for ${website.url}: ${isRollover ? 'Rollover detected' : 'No rollover'}`);

      if (isRollover) {
        // Update stored hashes and log the deployment event
        await kv.set(`hashes:${website.url}`, JSON.stringify(assetHashes));
        await logDeploymentEvent(website.url, assetHashes);
        console.log(`Logged deployment event for ${website.url}`);
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
  const timestamp = new Date().toISOString();
  const event = { url, newDeployments, timestamp };
  const events = await kv.get('deploymentEvents') || [];
  events.push(event);
  await kv.set('deploymentEvents', JSON.stringify(events));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    await checkDeployments();
    res.status(200).json({ message: 'Deployment check completed' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
