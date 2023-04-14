import fetch from 'node-fetch';

export async function getAllListings() {
  //const response = await fetch('http://85.251.40.44:3001/listings');
  const response = await fetch('http://192.168.0.30:3001/listings');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const listings = await response.json();
  return listings;
}