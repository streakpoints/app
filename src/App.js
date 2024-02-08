import Start from './Start';
import Collection from './Collection';
import Cast from './Cast';
import SP from './SP';
import Caravan from './Caravan';
import Collectors from './Collectors';
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

function App() {
  const spDev = true;
  if (window.location.host.indexOf('streakpoints.com') > -1 || spDev) {
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
            <Switch>
              <Route path='/' component={SP} />
            </Switch>
          </Router>
        </RainbowKitProvider>
      </WagmiConfig>
    );
  }
  const ecDev = false;
  if (window.location.host.indexOf('ethcaster.com') > -1 || ecDev) {
    return (
      <div style={{ position: 'relative' }}>
        <Router>
          <Switch>
            <Route path='/' component={Cast} />
          </Switch>
        </Router>
      </div>
    );
  }
  const isPrimarySale = window.location.host.indexOf('primary.sale') > -1;
  return (
    <div style={{ position: 'relative' }}>
      <Router>
        <Switch>
          <Route path='/collectors' component={Collectors} />
          <Route path='/account/:address?' component={Caravan} />
          <Route path='/:chain/:contractAddress' component={Collection} />
          <Route path='/:chain?' component={isPrimarySale ? Collectors : Start} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
