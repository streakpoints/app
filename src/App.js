import Start from './Start';
import Collection from './Collection';
import Cast from './Cast';
import Graph from './Graph';
import Caravan from './Caravan';
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
  return (
    <div style={{ position: 'relative' }}>
      <Router>
        <Switch>
          <Route path='/caravan/:address?' component={Caravan} />
          <Route path='/graph/:address?' component={Graph} />
          <Route path='/graph' component={Graph} />
          <Route path='/:chain/:contractAddress' component={Collection} />
          <Route path='/:chain?' component={Start} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
