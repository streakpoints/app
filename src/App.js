import Start from './Start';
import Collection from './Collection';
import Cast from './Cast';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

function App() {
  return (
    <div style={{ position: 'relative' }}>
      <Router>
        <Switch>
          <Route path='/ethcaster' component={Cast} />
          <Route path='/:chain/:contractAddress' component={Collection} />
          <Route path='/:chain?' component={Start} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
