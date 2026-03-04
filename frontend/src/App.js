import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Generator from "./pages/Generator";
import Library from "./pages/Library";
import "./App.css";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generate" element={<Generator />} />
          <Route path="/library" element={<Library />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;