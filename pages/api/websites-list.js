import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
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

      res.status(200).json(websitesList);
    } catch (error) {
      console.error('Error fetching or updating websites list:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
