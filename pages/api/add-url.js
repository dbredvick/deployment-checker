import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { url } = req.body;
            const websites = await kv.get('websites');
            const websitesList = typeof websites === 'string' ? JSON.parse(websites) : websites || [];

            // Check if the URL is already in the list
            const urlExists = websitesList.some(site => site.url === url);

            if (!urlExists) {
                // Add the new URL to the list
                websitesList.push({ url });
                await kv.set('websites', JSON.stringify(websitesList));
                res.status(201).json({ message: 'URL added successfully', url });
            } else {
                res.status(409).json({ message: 'URL already exists' });
            }
        } catch (error) {
            console.error('Error adding URL:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
