import { BrowserRouter as Router, Routes, Route, Link, Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import AuthContext, { AuthProvider } from "./context/AuthContext";
import { Toaster } from 'react-hot-toast';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard"; // Renamed/New Component
import ProviderDashboard from "./pages/ProviderDashboard";
import BookingPage from "./pages/BookingPage";
import Navbar from "./components/Navbar"; // New Component

const PrivateRoute = () => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div>Loading...</div>; // Or a nice spinner
    return user ? <Outlet /> : <Navigate to="/login" />;
};

const RoleBasedDashboard = () => {
    const { user } = useContext(AuthContext);
    if (user?.role === 'provider') return <ProviderDashboard />;
    return <UserDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Toaster position="top-center" reverseOrder={false} />
          <Navbar />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<RoleBasedDashboard />} />
                <Route path="/book/:providerId" element={<BookingPage />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;


