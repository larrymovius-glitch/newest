import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { Navbar } from "./components/Navbar";
import Home from "./pages/Home";
import Generator from "./pages/Generator";
import Library from "./pages/Library";
import Templates from "./pages/Templates";
import BatchGenerator from "./pages/BatchGenerator";
import Gallery from "./pages/Gallery";
import Analytics from "./pages/Analytics";
import TemplateCreator from "./pages/TemplateCreator";
import ScheduledPosts from "./pages/ScheduledPosts";
import Team from "./pages/Team";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generate" element={<Generator />} />
          <Route path="/library" element={<Library />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/batch" element={<BatchGenerator />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/template-creator" element={<TemplateCreator />} />
          <Route path="/scheduled" element={<ScheduledPosts />} />
          <Route path="/team" element={<Team />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;