import { useState, useContext, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Calendar as CalendarIcon, DollarSign, Briefcase, Clock, Trash2, Check, X, User, MapPin, AlertCircle, XCircle, Save } from "lucide-react";
import axios from "../api/axios";
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

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
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("calendar");
  const [services, setServices] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [bio, setBio] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // For Modal
  const [newService, setNewService] = useState({ name: "", price: "", duration: "" });
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState(null);

  // Stats
  const [stats, setStats] = useState({
      totalAppointments: 0,
      earnings: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel fetch: Profile (for services/schedule) AND Appointments
      const [profileRes, appointmentsRes] = await Promise.all([
          axios.get('/providers/me').catch(err => ({ data: { services: [], provider: { schedule: {} } } })), // Fallback if 404
          axios.get('/appointments/my-appointments')
      ]);

      // Handle Profile Data
      if(profileRes.data) {
         setServices(profileRes.data.services || []);
         setSchedule(profileRes.data.provider?.schedule || {});
         setBio(profileRes.data.provider?.bio || "");
         setProviderId(profileRes.data.provider?._id);
      }

      // Handle Appointments Data & Stats
      const appts = appointmentsRes.data || [];
      
      const total = appts.length;
      const earnings = appts
        .filter(a => a.status === 'confirmed')
        .reduce((acc, curr) => acc + (curr.serviceId?.price || 0), 0);
      
      setStats({ totalAppointments: total, earnings });

      // Map to Calendar Events
      const calendarEvents = appts.map(apt => {
          const datePart = apt.date.split('T')[0];
          const start = new Date(`${datePart}T${apt.slotTime}:00`);
          const duration = apt.serviceId?.duration || 60;
          const end = new Date(start.getTime() + duration * 60000);

          return {
              id: apt._id,
              title: `${apt.userId?.name || 'Client'} - ${apt.serviceId?.name || 'Service'}`,
              start,
              end,
              status: apt.status,
              resource: apt
          };
      });
      setEvents(calendarEvents);

    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
      try {
          await axios.put(`/appointments/${id}/status`, { status: newStatus });
          toast.success(`Appointment ${newStatus}`);
          setSelectedEvent(null); // Close modal
          fetchData(); // Refresh data
      } catch (err) {
          toast.error("Failed to update status");
      }
  };

  const eventStyleGetter = (event) => {
      let backgroundColor = '#3B82F6'; // Blue default
      if (event.status === 'confirmed') backgroundColor = '#10B981'; // Green
      if (event.status === 'cancelled') backgroundColor = '#EF4444'; // Red
      if (event.status === 'pending') backgroundColor = '#F59E0B'; // Yellow/Orange

      return {
          style: {
              backgroundColor,
              borderRadius: '5px',
              opacity: 0.8,
              color: 'white',
              border: '0px',
              display: 'block'
          }
      };
  };

  const handleSelectEvent = (event) => {
      setSelectedEvent(event);
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newService.name || !newService.price || !newService.duration) {
        toast.error("Please fill in all fields");
        return;
    }

    try {
      await axios.post('/providers/service', newService);
      toast.success("Service added successfully!");
      fetchData(); 
      setNewService({ name: "", price: "", duration: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add service");
    }
  };

  const handleScheduleChange = (day, field, value) => {
     setSchedule(prev => ({
         ...prev,
         [day]: { ...prev[day], [field]: value }
     }));
  };

  const handleSaveProfile = async () => {
    try {
        await axios.put('/providers/profile', { bio, schedule });
        toast.success("Profile saved successfully!");
    } catch (err) {
        toast.error("Failed to save profile");
        console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-slate-50">Loading Dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Provider Dashboard</h1>
            <p className="text-slate-600 mt-1">Manage appointments, services, and availability</p>
          </div>
          {providerId && (
            <Link to={`/book/${providerId}`} className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                View Public Profile
            </Link>
          )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard title="Total Services" value={services.length} icon={Briefcase} color="bg-blue-500" />
          <StatsCard title="Total Appointments" value={stats.totalAppointments} icon={CalendarIcon} color="bg-purple-500" />
          <StatsCard title="Total Earnings" value={`$${stats.earnings}`} icon={DollarSign} color="bg-green-500" />
      </div>

      {/* Tabs & Content */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden min-h-[600px]">
        <div className="border-b border-slate-100 flex overflow-x-auto">
             <button 
                className={`flex-1 py-4 text-center font-medium text-sm transition-colors whitespace-nowrap px-4 ${activeTab === 'calendar' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`} 
                onClick={() => setActiveTab('calendar')}
            >
                Appointments Calendar
            </button>
            <button 
                className={`flex-1 py-4 text-center font-medium text-sm transition-colors whitespace-nowrap px-4 ${activeTab === 'services' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`} 
                onClick={() => setActiveTab('services')}
            >
                My Services
            </button>
            <button 
                className={`flex-1 py-4 text-center font-medium text-sm transition-colors whitespace-nowrap px-4 ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`} 
                onClick={() => setActiveTab('profile')}
            >
                Profile & Schedule
            </button>
        </div>

        <div className="p-6 sm:p-8 h-full">
            {activeTab === 'calendar' && (
                <div className="h-[600px]">
                    <h3 className="font-bold text-lg mb-4 text-slate-800">Manage Schedule</h3>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '90%' }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={handleSelectEvent}
                    />
                </div>
            )}

            {activeTab === 'services' && (
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
            )}

            {activeTab === 'profile' && (
                <div className="max-w-4xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-800">Profile & Availability</h3>
                        <button 
                            onClick={handleSaveProfile}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow transition-all"
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    </div>

                    <div className="grid gap-8">
                        {/* Bio Section */}
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                             <label className="block font-bold text-slate-900 mb-2">My Bio</label>
                             <textarea 
                                className="w-full p-4 border border-slate-300 rounded-lg h-32 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Tell clients about yourself..."
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                             />
                        </div>

                        {/* Schedule Section */}
                        <div>
                             <h4 className="font-bold text-slate-900 mb-4">Weekly Schedule</h4>
                             <div className="space-y-3">
                                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                                    <div key={day} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border transition-colors ${schedule[day]?.isDayOff ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200'}`}>
                                        <div className="w-32 flex justify-between sm:block">
                                            <span className="font-bold text-slate-900 block">{day}</span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${schedule[day]?.isDayOff ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {schedule[day]?.isDayOff ? 'Day Off' : 'Active'}
                                            </span>
                                        </div>
                                        
                                        {schedule[day] && !schedule[day].isDayOff && (
                                            <div className="flex-1 flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={16} className="text-slate-400"/>
                                                    <input type="time" className="border-slate-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                                                        value={schedule[day].startTime || ""} 
                                                        onChange={e => handleScheduleChange(day, 'startTime', e.target.value)}
                                                    />
                                                    <span className="text-slate-400">-</span>
                                                    <input type="time" className="border-slate-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                                                        value={schedule[day].endTime || ""} 
                                                        onChange={e => handleScheduleChange(day, 'endTime', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="sm:ml-auto self-end sm:self-center">
                                            <button 
                                                className={`p-2 rounded-full transition-colors ${schedule[day]?.isDayOff ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                                                onClick={() => handleScheduleChange(day, 'isDayOff', !schedule[day].isDayOff)}
                                                title={schedule[day]?.isDayOff ? "Mark as Active" : "Mark as Day Off"}
                                            >
                                                {schedule[day]?.isDayOff ? <Check size={18}/> : <X size={18}/>}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
      {/* MANAGE APPOINTMENT MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-slate-900">Manage Appointment</h3>
                        <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600">
                            <XCircle size={24} />
                        </button>
                    </div>
                    
                    <div className="mb-6 space-y-3">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                {selectedEvent.resource.userId?.name?.charAt(0)}
                             </div>
                             <div>
                                 <p className="text-sm text-slate-500 font-medium">Client</p>
                                 <p className="font-bold text-slate-900">{selectedEvent.resource.userId?.name}</p>
                             </div>
                        </div>
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                <Briefcase size={18} />
                             </div>
                             <div>
                                 <p className="text-sm text-slate-500 font-medium">Service</p>
                                 <p className="font-bold text-slate-900">{selectedEvent.resource.serviceId?.name}</p>
                             </div>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                <Clock size={18} />
                             </div>
                             <div>
                                 <p className="text-sm text-slate-500 font-medium">Date & Time</p>
                                 <p className="font-bold text-slate-900">
                                     {format(selectedEvent.start, 'PP')} at {format(selectedEvent.start, 'p')}
                                 </p>
                             </div>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold">
                                <AlertCircle size={18} />
                             </div>
                             <div>
                                 <p className="text-sm text-slate-500 font-medium">Current Status</p>
                                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mt-1 ${
                                     selectedEvent.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                     selectedEvent.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                     'bg-yellow-100 text-yellow-800'
                                 }`}>
                                     {selectedEvent.status}
                                 </span>
                             </div>
                        </div>
                    </div>

                    <div className="grid gap-3">
                         {selectedEvent.status === 'pending' && (
                             <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => handleUpdateStatus(selectedEvent.id, 'confirmed')}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
                                >
                                    <Check size={18} /> Accept
                                </button>
                                <button 
                                    onClick={() => handleUpdateStatus(selectedEvent.id, 'cancelled')}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
                                >
                                    <X size={18} /> Reject
                                </button>
                             </div>
                         )}

                         {selectedEvent.status === 'confirmed' && (
                             <button 
                                onClick={() => {
                                    if(window.confirm('Are you sure you want to cancel this confirmed appointment?')) {
                                        handleUpdateStatus(selectedEvent.id, 'cancelled');
                                    }
                                }}
                                className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 rounded-lg transition-colors"
                            >
                                Cancel Appointment
                            </button>
                         )}

                         {selectedEvent.status === 'cancelled' && (
                             <div className="text-center text-slate-500 py-2 bg-slate-50 rounded-lg">
                                 This appointment is cancelled.
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard;
