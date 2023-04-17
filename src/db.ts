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


export async function getAllListings() {
  const response = await fetch('http://192.168.0.30:3001/listings');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const listings = await response.json();
  return {
    tokens: listings.map((listing: Listing) => ({
      token: {
        contract: extractContractAddress(listing.link), // Add contract address
        tokenId: listing.token.toString(),
        name: "", // Add token name
        description: "", // Add token description
        image: listing.imageUrl || "",
        // Add other token properties if needed
      },
      market: {
        floorAsk: {
          price: {
            currency: {
              contract: "", // Add currency contract address
              name: "", // Add currency name
              symbol: listing.coin,
              decimals: 0, // Add currency decimals
            },
            amount: {
              raw: "", // Add raw amount
              decimal: listing.price,
              usd: 0, // Add USD amount if needed
              native: 0, // Add native amount if needed
            },
          },
        },
      },
      // Add other market properties if needed
    })),
  };
}
