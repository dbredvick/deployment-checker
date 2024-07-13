process.env.KV_REST_API_URL = "https://factual-grub-48450.upstash.io";
process.env.KV_REST_API_TOKEN = "Ab1CAAIncDFlMjk5YjdmZGI1M2M0YjI0YjFhMmQ2ZmZlODMyMjI5YnAxNDg0NTA";

const { kv } = require('@vercel/kv');

async function getWebsitesList() {
  try {
    const websites = await kv.get('websites');
    const websitesList = typeof websites === 'string' ? JSON.parse(websites) : websites || [];
    console.log('Current list of websites:', websitesList);

    // Check if drew.tech is already in the list
    const drewTechExists = websitesList.some(site => site.url === 'https://drew.tech');

    if (!drewTechExists) {
      // Add drew.tech to the list
      websitesList.push({ url: 'https://drew.tech' });
      await kv.set('websites', JSON.stringify(websitesList));
      console.log('Added drew.tech to the list of websites.');
    }
  } catch (error) {
    console.error('Error fetching or updating websites list:', error);
  }
}

getWebsitesList();
