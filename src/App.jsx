import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FluidCanvas from './components/FluidCanvas';
import FAQList from './components/FAQList';
import Links from './components/Links';

function App() {
  return (
    <Router>
      <FluidCanvas />
      <main className="content">
        <Routes>
          <Route path="/" element={
            <>
              <div className="header">
                <h1>My name is SirBanditDook (kinda) and Welcome!</h1>
              </div>
              <br />
              <FAQList />
            </>
          } />
          <Route path="/links" element={<Links />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
