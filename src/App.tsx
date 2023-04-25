import "./App.css";

import {
  createClient as createWagmiClient,
  configureChains,
  WagmiConfig,
  chain,
} from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { InjectedConnector } from "wagmi/connectors/injected";
import Sweep from "./sweep";
import { createClient } from "@reservoir0x/reservoir-kit-client";

//setup mainnet or goerli
const { chains } = configureChains([chain.mainnet], [publicProvider()]);

const client = createWagmiClient({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains,
      options: {
        name: "Injected",
        shimDisconnect: true,
      },
    }),
  ],
});
//setup goerli or mainnet URL https://api.reservoir.tools,https://api-goerli.reservoir.tools, https://api-optimism.reservoir.tools
createClient({
  apiBase: "https://api.reservoir.tools",
});

export default function App() {
  return (
    <WagmiConfig client={client}>
      <div className="App">
        <header className="App-header">NFT Alerts FastBuy Demo</header>
        <Sweep />
      </div>
    </WagmiConfig>
  );
}
