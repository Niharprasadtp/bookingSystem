import { useState, useContext, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Calendar, DollarSign, Briefcase, Clock, Trash2, Edit2, Check, X } from "lucide-react";

const StatsCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
      <div className={`p-4 rounded-full ${color} mr-4`}>
          <Icon size={24} className="text-white" />
      </div>
      <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
  </div>
);

const ProviderDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("services");
  const [services, setServices] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [newService, setNewService] = useState({ name: "", price: "", duration: "" });
  const [loading, setLoading] = useState(true);

  const API_URL = `${import.meta.env.VITE_API_URL}/providers`;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const allProvidersRes = await fetch(API_URL);
      const allProviders = await allProvidersRes.json();
      const myProvider = allProviders.find(p => p.userId._id === user._id || p.userId === user._id);
      
      if (myProvider) {
          const profileRes = await fetch(`${API_URL}/${myProvider._id}`);
          const profileData = await profileRes.json();
          setServices(profileData.services || []);
          setSchedule(profileData.provider.schedule || {});
      }
    } catch (error) {
      toast.error("Failed to load profile data");
      console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newService.name || !newService.price || !newService.duration) {
        toast.error("Please fill in all fields");
        return;
    }

    try {
      const res = await fetch(`${API_URL}/service`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(newService)
      });
      if(res.ok) {
        toast.success("Service added successfully!");
        fetchProfile(); 
        setNewService({ name: "", price: "", duration: "" });
      } else {
          throw new Error("Failed to add service");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateSchedule = async (day, field, value) => {
    const updatedDay = { ...schedule[day], [field]: value };
    const payload = { schedule: { [day]: updatedDay } };
    
    try {
        const res = await fetch(`${API_URL}/schedule`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });
        if(res.ok) {
            toast.success("Schedule updated"); // Maybe too chatty, but good for feedback
            const data = await res.json();
            setSchedule(data); 
        }
    } catch (err) {
        toast.error("Failed to update schedule");
    }
  };



  if (loading) return <div className="flex justify-center items-center h-screen bg-slate-50">Loading Dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ... header ... */}
      <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Provider Dashboard</h1>
            <p className="text-slate-600 mt-1">Manage your services and availability</p>
          </div>
          <Link to={`/book/${user._id}`} className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
              View Public Profile
          </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard title="Total Services" value={services.length} icon={Briefcase} color="bg-blue-500" />
          <StatsCard title="Today's Appointments" value="0" icon={Calendar} color="bg-purple-500" />
          <StatsCard title="Total Earnings" value="$0.00" icon={DollarSign} color="bg-green-500" />
      </div>


      {/* Tabs & Content */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 flex">
            <button 
                className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${activeTab === 'services' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`} 
                onClick={() => setActiveTab('services')}
            >
                My Services
            </button>
            <button 
                className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${activeTab === 'schedule' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`} 
                onClick={() => setActiveTab('schedule')}
            >
                Weekly Schedule
            </button>
        </div>

        <div className="p-6 sm:p-8">
            {activeTab === 'services' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* List */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 text-slate-800">Current Services</h3>
                        {services.length === 0 ? (
                            <div className="text-slate-500 italic p-4 bg-slate-50 rounded border border-slate-100 text-center">No services added yet.</div>
                        ) : (
                            <ul className="space-y-3">
                                {services.map(s => (
                                    <li key={s._id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                                        <div>
                                            <h4 className="font-bold text-slate-900">{s.name}</h4>
                                            <div className="flex items-center text-sm text-slate-500 mt-1 gap-3">
                                                <span className="flex items-center gap-1"><Clock size={14}/> {s.duration} min</span>
                                                <span className="flex items-center gap-1"><DollarSign size={14}/> {s.price}</span>
                                            </div>
                                        </div>
                                        <button className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Add Form */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                        <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2"><Plus size={20}/> Add New Service</h3>
                        <form onSubmit={handleAddService} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Service Name</label>
                                <input className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Haircut" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                                    <input className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" type="number" placeholder="50" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (min)</label>
                                    <input className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" type="number" placeholder="30" value={newService.duration} onChange={e => setNewService({...newService, duration: e.target.value})} />
                                </div>
                            </div>
                            <button className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow flex justify-center items-center gap-2">
                                <Plus size={18} /> Add Service
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    <h3 className="font-bold text-lg mb-2 text-slate-800">Your Availability</h3>
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                        <div key={day} className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${schedule[day]?.isDayOff ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200'}`}>
                            <div className="w-32">
                                <span className="font-bold text-slate-900 block">{day}</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${schedule[day]?.isDayOff ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {schedule[day]?.isDayOff ? 'Day Off' : 'Active'}
                                </span>
                            </div>
                            
                            {schedule[day] && !schedule[day].isDayOff && (
                                <div className="flex-1 flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} className="text-slate-400"/>
                                        <input type="time" className="border-slate-300 rounded p-1 text-sm" 
                                            value={schedule[day].startTime || ""} 
                                            onChange={e => handleUpdateSchedule(day, 'startTime', e.target.value)}
                                        />
                                        <span className="text-slate-400">-</span>
                                        <input type="time" className="border-slate-300 rounded p-1 text-sm" 
                                            value={schedule[day].endTime || ""} 
                                            onChange={e => handleUpdateSchedule(day, 'endTime', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="ml-auto">
                                <button 
                                    className={`p-2 rounded-full transition-colors ${schedule[day]?.isDayOff ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                                    onClick={() => handleUpdateSchedule(day, 'isDayOff', !schedule[day].isDayOff)}
                                    title={schedule[day]?.isDayOff ? "Mark as Active" : "Mark as Day Off"}
                                >
                                    {schedule[day]?.isDayOff ? <Check size={18}/> : <X size={18}/>}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
