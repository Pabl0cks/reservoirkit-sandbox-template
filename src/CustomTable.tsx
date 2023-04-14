// pages/index.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
//import Head from 'next/head';
import { useListings } from './hooks/useListings';
import { Listing } from './types';

function formatSellerAddress(sellerAddress: string): string {
  return sellerAddress.slice(0, 2) + '...' + sellerAddress.slice(-4);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  date.setHours(date.getHours() + 2); // Add 2 hours to the date
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

function truncateToTwoDecimals(num: number): number {
  return Math.floor(num * 1000) / 1000;
}

function CustomTable() {
  const { listings, loading } = useListings();

  console.log('listings:', listings, 'loading:', loading); // Add this line

  if (loading || !listings) {
    return <p>Loading...</p>;
  }

  return (
    <div>
        <title>NFT Listings</title>
        <style>
          {`
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              margin: 0;
              padding: 0;
            }
            
            main {
              max-width: 1920px;
              margin: 20px auto;
              padding: 20px;
              background-color: #f5f5f5;
              border-radius: 8px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
            }
            
            th,
            td {
              text-align: left;
              padding: 8px;
              border-bottom: 1px solid #e0e0e0;
            }
            
            th {
              background-color: #e0e0e0;
            }
            
            tr:nth-child(even) {
              background-color: #f2f2f2;
            }
            
            tr:hover {
              background-color: #ddd;
            }
            
            a.button {
              display: inline-block;
              background-color: #0070f3;
              color: white;
              text-decoration: none;
              padding: 6px 12px;
              border-radius: 4px;
            }

            a.button:hover {
              background-color: #0056b3;
            }
          `}
        </style>
      <main>
        <h1>NFT Listings</h1>
        <table>
          <thead>
            <tr>
              <th>List Date</th>
              <th>Seller Name</th>
              <th>Collection Slug</th>
              <th>Collection Name</th>
              <th>Token</th>
              <th>Price</th>
              <th>Price Target</th>
              <th>Alert</th>
              <th>Collection Floor</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing: Listing) => (
              <tr key={listing.listdate}>
                <td>{formatDate(listing.listdate)}</td>
                <td>
                  {listing.sellername ||
                    formatSellerAddress(listing.selleraddress)}
                </td>
                <td>{listing.collectionslug}</td>
                <td>{listing.collectionname}</td>
                <td>{listing.token}</td>
                <td>{truncateToTwoDecimals(listing.price)} ({listing.coin})</td>
                <td>{truncateToTwoDecimals(listing.pricetarget)}</td>
                <td>{listing.alert}</td>
                <td>{truncateToTwoDecimals(listing.collectionfloor)}</td>
                <td>
                  <a href={listing.link} target="_blank" rel="noopener noreferrer" className="button">
                    Open Link
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

    </div>
  );
}

export default CustomTable;