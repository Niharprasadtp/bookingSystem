import { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    const fetchProviders = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/providers`);
            const data = await res.json();
            setProviders(data);
        } catch (err) {
            console.error(err);
        }
    };
    fetchProviders();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">User Dashboard</h1>
          <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Logout
          </button>
      </div>

      <p className="mb-6 text-xl">Welcome, {user?.name}. Ready to book?</p>

      <h2 className="text-2xl font-bold mb-4">Available Providers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map(p => (
              <div key={p._id} className="bg-white p-5 rounded-lg shadow-md hover:shadow-xl transition-shadow border">
                  <h3 className="font-bold text-lg mb-2">{p.userId?.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{p.bio || "No bio available."}</p>
                  <Link to={`/book/${p._id}`} className="block text-center bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                      Book Appointment
                  </Link>
              </div>
          ))}
      </div>
    </div>
  );
};

export default Dashboard;

