process.env.KV_REST_API_URL = "https://factual-grub-48450.upstash.io";
process.env.KV_REST_API_TOKEN = "Ab1CAAIncDFlMjk5YjdmZGI1M2M0YjI0YjFhMmQ2ZmZlODMyMjI5YnAxNDg0NTA";

const { kv } = require('@vercel/kv');

async function getWebsitesList() {
  try {
    const websites = JSON.parse(await kv.get('websites')) || [];
    console.log('Current list of websites:', websites);

    // Check if drew.tech is already in the list
    const drewTechExists = websites.some(site => site.url === 'https://drew.tech');

    if (!drewTechExists) {
      // Add drew.tech to the list
      websites.push({ url: 'https://drew.tech' });
      await kv.set('websites', JSON.stringify(websites));
      console.log('Added drew.tech to the list of websites.');
    }
  } catch (error) {
    console.error('Error fetching or updating websites list:', error);
  }
}

getWebsitesList();
