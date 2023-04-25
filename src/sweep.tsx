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

      const expectedPrice = token.market?.floorAsk?.price?.amount?.decimal;

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
            <th>Buy Now</th>
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
                  src={
                    token.nftalerts.chathook === null ||
                    token.nftalerts.chathook === undefined ||
                    token.nftalerts.chathook === ""
                      ? "https://opensea.io/static/images/logos/opensea.svg"
                      : token.nftalerts.chathook
                  }
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
              </td>
              <td>
                {" "}
                {/* Add a new table data element for the Buy button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the row click event
                    handleBuyClick(token);
                  }}
                >
                  Buy
                </button>
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
