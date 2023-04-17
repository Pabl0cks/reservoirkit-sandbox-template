// db.js
import fetch from 'cross-fetch';
import { Listing } from "./types";

function extractContractAddress(url: string) {
  const regex = /https:\/\/opensea\.io\/assets\/ethereum\/(0x[a-fA-F0-9]{40})/;
  const match = url.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  return null;
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

function formatSellerAddress(sellerAddress: string): string {
  return sellerAddress.slice(0, 2) + '...' + sellerAddress.slice(-4);
}

export async function getAllListings() {
  const response = await fetch('http://192.168.0.30:3001/listings');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const listings = await response.json();
  return {
    tokens: listings.map((listing: Listing) => ({
      token: {
        contract: extractContractAddress(listing.link),
        tokenId: listing.token.toString(),
        name: "",
        description: "",
        image: listing.chathook || "",
      },
      market: {
        floorAsk: {
          price: {
            currency: {
              contract: "",
              name: "",
              symbol: listing.coin,
              decimals: 0,
            },
            amount: {
              raw: "",
              decimal: listing.price,
              usd: 0,
              native: 0,
            },
          },
        },
      },
      nftalerts: {
        listdate: formatDate(listing.listdate), // Transform listdate using formatDate function
        sellername: listing.sellername ||
                    formatSellerAddress(listing.selleraddress), // Update with the respective property
        collectionslug: listing.collectionslug, // Update with the respective property
        collectionname: listing.collectionname, // Update with the respective property
        pricetarget: listing.pricetarget, // Update with the respective property
        alert: listing.alert, // Update with the respective property
        collectionfloor: listing.collectionfloor, // Update with the respective property
        link: listing.link, // Update with the respective property
        imagepreview: listing.chathook,
      },
    })),
  };
}
