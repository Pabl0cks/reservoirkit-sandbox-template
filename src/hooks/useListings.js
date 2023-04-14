// hooks/useListings.js

import { useQuery } from 'react-query';
import axios from 'axios';
import { useState, useEffect } from 'react';


export function useListings() {
  const [listings, setListings] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch('http://192.168.0.30:3001/listings');
        const data = await response.json();
        setListings(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  return { listings, error, loading };
}
