// hooks/useListings.js
import { useQuery } from 'react-query';
import axios from 'axios';

const fetchListings = async () => {
  try {
    const { data } = await axios.get('/src/api/listings');
    return data;
  } catch (error) {
    console.error('Error fetching listings:', error);
    throw error;
  }
};

export const useListings = (options) => {
  return useQuery('listings', fetchListings, {
    refetchInterval: 1000, // Adjust this value to control the refresh rate (in ms)
    ...options,
  });
};
