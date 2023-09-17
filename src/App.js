import Start from './Start';
import Collection from './Collection';
import Cast from './Cast';
import Caravan from './Caravan';
import Collectors from './Collectors';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

function App() {
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
