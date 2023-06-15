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
          <Route exact path='/' component={Start} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
