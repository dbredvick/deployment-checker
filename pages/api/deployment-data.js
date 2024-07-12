import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const deploymentEvents = JSON.parse(await kv.get('deploymentEvents')) || [];
      res.status(200).json(deploymentEvents);
    } catch (error) {
      console.error('Error fetching deployment data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
