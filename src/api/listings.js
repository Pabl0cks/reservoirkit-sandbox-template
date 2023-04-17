// pages/api/listings.js
import nextConnect from 'next-connect';
import { getAllListings } from '../lib/db';

const handler = nextConnect();

handler.get(async (req, res) => {
  try {
    const listings = await getAllListings();
    res.status(200).json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'An error occurred while fetching listings' });
  }
});

export default handler;
