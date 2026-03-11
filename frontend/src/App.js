import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import Products from "./pages/Products";
import Integration from "./pages/Integration";
import QuickCreate from "./pages/QuickCreate";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import Admin from "./pages/Admin";
import LearnAffiliate from "./pages/LearnAffiliate";
import AnyAdPro from "./pages/AnyAdPro";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/generate" element={<ProtectedRoute><Generator /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/batch" element={<ProtectedRoute><BatchGenerator /></ProtectedRoute>} />
            <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/template-creator" element={<ProtectedRoute><TemplateCreator /></ProtectedRoute>} />
            <Route path="/scheduled" element={<ProtectedRoute><ScheduledPosts /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/integration" element={<ProtectedRoute><Integration /></ProtectedRoute>} />
            <Route path="/quick-create" element={<ProtectedRoute><QuickCreate /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/learn" element={<ProtectedRoute><LearnAffiliate /></ProtectedRoute>} />
            <Route path="/anyadpro" element={<ProtectedRoute><AnyAdPro /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
