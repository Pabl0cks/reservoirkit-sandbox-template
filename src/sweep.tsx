import { useEffect, useState } from "react";

import getCollectionFloor, { Token } from "./getListings";
import { useConnect, useSigner, useNetwork } from "wagmi";
import { WalletConnector } from "./utils/walletConnector";
import {
  Execute,
  getClient,
  ReservoirClientActions,
} from "@reservoir0x/reservoir-kit-client";
import { constants } from "ethers";



async function sweepTokens(
  sweepTotal: number | undefined,
  tokens: Parameters<ReservoirClientActions["buyToken"]>["0"]["tokens"],
  progressCallback: (message: string) => void,
  signer?: ReturnType<typeof useSigner>["data"],
  sweepCurrency?: string
) {
  // Required parameters to complete the transaction
  if (!signer) {
    throw new ReferenceError("Missing a signer");
  }

  try {
    // Then we supply these parameters to the buyToken
    // There are a couple of key parameters which we'll dive into

    // Pass any additional parameters to the underlying execute buy api, using the client actions type to extract the right types
    const options: Parameters<
      ReservoirClientActions["buyToken"]
    >[0]["options"] = {};

    if (sweepCurrency) {
      options.currency = sweepCurrency;
    }

    


    // debug data sent to the API to check errors
    // console.log('tokens', tokens);
    // console.log('signer', signer);
    // console.log('expectedPrice', sweepTotal);
    // console.log('options', options);



    getClient()
      ?.actions.buyToken({
        tokens: tokens,
        signer: signer,
        // The expectedPrice is used to protect against price mismatch issues when prices are rapidly changing
        // The expectedPrice can be omitted but the best practice is to supply this
        expectedPrice: sweepTotal,
        // Pass any additional parameters to the underlying execute buy api
        options,
        // The onProgress callback function is used to update the caller of the buyToken method
        // It passes in a set of steps that the SDK is following to process the transaction
        // It's useful for determining what step we're currently on and displaying a message to the user
        onProgress: (steps: Execute["steps"]) => {
          if (!steps) {
            return;
          }
          const currentStep = steps.find((step) =>
            step.items?.find((item) => item.status === "incomplete")
          );
          if (currentStep) {
            const progress = currentStep.items?.findIndex(
              (item) => item.status === "incomplete"
            );
            progressCallback(
              currentStep.action
                ? `${currentStep.action} (${(progress || 0) + 1}/${
                    currentStep.items?.length
                  })`
                : ""
            );
          }
        },
      })
      .then(() => {
        progressCallback("Success");
      })
      .catch((error: Error) => {
        progressCallback(`Error: ${error.message}`);
      });

    return true;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export default function Sweep() {
  const { data: signer } = useSigner();
  const { connectors, isConnected } = useConnect();
  const { activeChain } = useNetwork();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [sweepTotal, setSweepTotal] = useState(0);
  const [sweepCurrencyContract, setSweepCurrencyContract] = useState<
    string | undefined
  >();
  const [collectionId, setCollectionId] = useState(
    "0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b"
  );
  const [inputValue, setInputValue] = useState(
    "0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b"
  );
  const [progressText, setProgressText] = useState("");

  const handleBuyClick = async (token: Token) => {
    if (isConnected) {
      handleOnChange(token); // Auto mark the sweep checkbox for the respective row

      const tokens = [
        {
          tokenId: token.token?.tokenId as string,
          contract: token.token?.contract as string,
        },
      ];

      const expectedPrice =
        token.market?.floorAsk?.price?.amount?.decimal;

      sweepTokens(
        expectedPrice,
        tokens,
        setProgressText,
        signer,
        sweepCurrencyContract
      );
    } else {
      await connector.connect();
    }
  };

      //force values to debug the API error
    if (tokens) {
      tokens.forEach((token) => {
        token.nftalerts.chathook="data:image/png;base64,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"
        //token.nftalerts.chathook = 'https://i.seadn.io/gcs/files/7c2af618840f06afc63c29d8667fecf9.jpg?w=50&auto=format';
      });
    }


  const handleOnChange = (token: Token) => {
    const selectedTokenIds = selectedTokens.map(
      (token) => token.token?.tokenId
    );
    const selected = selectedTokenIds.includes(token.token?.tokenId);
    let updatedselectedTokens = selectedTokens.slice();

    if (selected) {
      updatedselectedTokens = selectedTokens.filter(
        (selectedToken) => selectedToken.token?.tokenId !== token.token?.tokenId
      );
    } else {
      updatedselectedTokens.push(token);
    }

    setSelectedTokens(updatedselectedTokens);
    const ids: string[] = [];
    updatedselectedTokens.forEach((token) => {
      if (token.token?.tokenId) {
        ids.push(token.token.tokenId);
      }
    });
    setSelectedTokenIds(ids);
  };

  useEffect(() => {
      // Function to fetch data and update the state
      const fetchData = async () => {
        const tokens = await getCollectionFloor(collectionId);
        setTokens(tokens);
      };

      // Fetch data initially
      fetchData();

      // Set up an interval to fetch data every second (1000 ms)
      const interval = setInterval(() => {
        fetchData();
      }, 1000);

      // Clear the interval when the component is unmounted
      return () => {
        clearInterval(interval);
      };
    }, [collectionId]);

  useEffect(() => {
    const newTotal = tokens.reduce((total, token) => {
      if (
        token.token &&
        selectedTokenIds.includes(token.token?.tokenId) &&
        token.market?.floorAsk?.price?.amount?.decimal
      ) {
        total += token.market.floorAsk.price.amount.decimal;
      }
      return total;
    }, 0);

    setSweepTotal(newTotal);
  }, [tokens, selectedTokenIds]);

  const connector = connectors[0];
  const selectedTokensCurrencies = selectedTokens.map(
    (token) => token.market?.floorAsk?.price?.currency
  );

  if (
    !selectedTokensCurrencies.find(
      (currency) => currency?.contract === constants.AddressZero
    )
  ) {
    selectedTokensCurrencies.push({
      contract: constants.AddressZero,
      symbol: "ETH",
      decimals: 18,
      name: "Ether",
    });
  }

  return (
    <>
      <WalletConnector />

      {/* Move the Sweep Tokens button and currency dropdown */}
      <select
        style={{ marginRight: 20 }}
        value={sweepCurrencyContract}
        onChange={(e) => {
          setSweepCurrencyContract(e.target.value);
        }}
      >
        <option disabled selected>
          Currency
        </option>
        {selectedTokensCurrencies.map((currency) => (
          <option value={currency?.contract}>{currency?.symbol}</option>
        ))}
      </select>
      {/* 1 - mainnet // 5 - goerli */}
      <button
        disabled={selectedTokens.length === 0}
        onClick={async () => {
          if (activeChain?.id !== 1) {
            alert(
              "You are connected to the wrong network. Please use the Mainnet network."
            );
            return;
          }

          if (!isConnected) {
            await connector.connect();
          }
          setProgressText("");
          let expectedPrice: number | undefined = sweepTotal;
          const firstTokenCurrency =
            selectedTokens[0].market?.floorAsk?.price?.currency?.contract;
          let mixedCurrencies = false;

          const tokens = selectedTokens.map((token) => {
            if (!mixedCurrencies) {
              mixedCurrencies =
                token.market?.floorAsk?.price?.currency?.contract !==
                firstTokenCurrency;
            }
            return {
              tokenId: token.token?.tokenId as string,
              contract: token.token?.contract as string,
            };
          });
          if (mixedCurrencies) {
            expectedPrice = undefined;
          }
          sweepTokens(
            expectedPrice,
            tokens,
            setProgressText,
            signer,
            sweepCurrencyContract
          );
        }}
      >
        Sweep Tokens
      </button>

      {progressText.length > 0 && (
        <div className="progress-text">
          <b>Progress:</b> {progressText}
        </div>
      )}


      <table className="sweep-list">
      <thead>
        <tr>
          <th></th>
          <th>Token Id</th>
          <th>Price</th>
          <th>Sweep</th>
          <th>List Date</th>
          <th>Seller Name</th>
          <th>Collection Slug</th>
          <th>Collection Name</th>
          <th>Price Target</th>
          <th>Alert</th>
          <th>Collection Floor</th>
          <th>Link</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token, i) => (
          <tr key={i}>
            <td>
              <img
                src={token.nftalerts.chathook}
                alt={`NFT ${token.token?.tokenId}`}
                style={{ maxHeight: "50px", maxWidth: "50px" }}
              />
            </td>
            <td>{token.token?.tokenId}</td>
            <td>
              {token.market?.floorAsk?.price?.amount?.decimal}{" "}
              {token.market?.floorAsk?.price?.currency?.symbol}
            </td>
            <td>
              <input
                type="checkbox"
                value={token.token?.tokenId}
                checked={
                  token.token?.tokenId
                    ? selectedTokenIds.includes(token.token.tokenId)
                    : false
                }
                onChange={() => handleOnChange(token)}
              />
              <button onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the row click event
                handleBuyClick(token);
              }}>Buy</button>
            </td>
            <td>{token.nftalerts.listdate}</td>
            <td>{token.nftalerts.sellername}</td>
            <td>{token.nftalerts.collectionslug}</td>
            <td>{token.nftalerts.collectionname}</td>
            <td>{token.nftalerts.pricetarget}</td>
            <td>{token.nftalerts.alert}</td>
            <td>{token.nftalerts.collectionfloor}</td>
            <td>
              <a href={token.nftalerts.link} target="_blank" rel="noreferrer">
                View on OpenSea
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

      {!tokens.length && (
        <div className="empty-message">
          Enter a collection address to get available tokens
        </div>
      )}


    </>
  );
}
