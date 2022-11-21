import Tweet from './Tweet';
import Setup from './Setup';
import Start from './Start';
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
          <Route path='/i' component={Setup} />
          <Route exact path='/' component={Start} />
          <Route path='/:handle?' component={Tweet} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
