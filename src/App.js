import Tweet from './Tweet';
import Setup from './Setup';
// import Start from './Start';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

function App() {
  return (
    <Router>
      <Switch>
        <Route path='/i' component={Setup} />
        <Route exact path='/' component={Setup} />
        <Route path='/:handle?' component={Tweet} />
      </Switch>
    </Router>
  );
}

export default App;
