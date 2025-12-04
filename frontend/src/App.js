import { useEffect } from "react";
import "./App.css";
import { HashRouter, Routes, Route } from "react-router-dom";
import GamePage from "./pages/GamePage";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <div className="App">
      <HashRouter>
        <Routes>
          <Route path="/" element={<GamePage />} />
        </Routes>
      </HashRouter>
      <Toaster />
    </div>
  );
}

export default App;