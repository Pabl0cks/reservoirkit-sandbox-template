// getListings.ts
import { getAllListings } from "./db";

export type Token = NonNullable<
  // Update the type definition to match the new format
  {
    token: {
      contract: string;
      tokenId: string;
      name: string;
      description: string;
      image: string;
      media: string;
      kind: string;
      isFlagged: boolean;
      lastFlagUpdate: string;
      lastFlagChange: string;
      rarity: number;
      rarityRank: number;
      collection: {
        id: string;
        name: string;
        image: string;
        slug: string;
      };
      lastBuy: {
        value: number;
        timestamp: number;
      };
      lastSell: {
        value: number;
        timestamp: number;
      };
      owner: string;
      attributes: Array<{
        key: string;
        kind: string;
        value: string;
        tokenCount: number;
        onSaleCount: number;
        floorAskPrice: number;
        topBidValue: number;
        createdAt: string;
      }>;
    };
    market: {
      floorAsk: {
        id: string;
        price: {
          currency: {
            contract: string;
            name: string;
            symbol: string;
            decimals: number;
          };
          amount: {
            raw: string;
            decimal: number;
            usd: number;
            native: number;
          };
          netAmount: {
            raw: string;
            decimal: number;
            usd: number;
            native: number;
          };
        };
      };
    };
  }
>;

export default async function getCollectionFloor(
  collection: string
): Promise<Token[]> {
  const data = await getAllListings();
  // Filter the tokens based on the collection if needed
  return data.tokens;
}
