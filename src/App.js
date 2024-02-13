import { Buffer } from "buffer";
import SP from './SP';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
  polygon,
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { infuraProvider } from 'wagmi/providers/infura';
import {
  darkTheme, getDefaultWallets, RainbowKitProvider, Theme,
} from '@rainbow-me/rainbowkit';
window.Buffer = Buffer;

function App() {
  if (
    window.location.host.indexOf('streakpoints.com') > -1 ||
    window.location.host.indexOf('localhost') > -1
  ) {
    const { chains, publicClient } = configureChains([polygon],[publicProvider()]);
    const WALLET_CONNECT_PROJECT_ID = '6c4e35db337f7801ccb9ce0d5e481c33';
    const { connectors } = getDefaultWallets({
      appName: 'StreakPoints',
      projectId: WALLET_CONNECT_PROJECT_ID,
      chains,
    });
    const wagmiConfig = createConfig({
      autoConnect: true,
      connectors,
      publicClient,
    });

    return (
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains} theme={darkTheme()}>
          <Router>
            <SP />
          </Router>
        </RainbowKitProvider>
      </WagmiConfig>
    );
  }
}

export default App;
