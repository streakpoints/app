import Tweet from './Tweet';
import Setup from './Setup';
// import Start from './Start';
import './App.css';
import {
  Link,
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

function App() {
  return (
    <Router>
      <h1 style={{ textAlign: 'center' }}>
        <Link style={{ textDecoration: 'none' }} to='/'>🎙</Link>
      </h1>
      <Switch>
        <Route path='/i' component={Setup} />
        <Route exact path='/' component={Setup} />
        <Route path='/:handle?' component={Tweet} />
      </Switch>
    </Router>
  );
}

export default App;
