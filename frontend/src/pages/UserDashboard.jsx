import { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import { Link } from "react-router-dom";
import { User, Calendar as CalendarIcon, Clock, MapPin, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import axios from "../api/axios";
import toast from "react-hot-toast";
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

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const [providers, setProviders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("browse");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      setLoading(true);
      try {
          // Parallel fetch
          const [providersRes, appointmentsRes] = await Promise.all([
              axios.get('/providers'),
              axios.get('/appointments/my-appointments')
          ]);

          setProviders(providersRes.data);
          setAppointments(appointmentsRes.data);

          // Map appointments to Calendar Events
          const calendarEvents = appointmentsRes.data.map(apt => {
              // Parse date and time. Backend stores date as "2024-03-20T00:00:00.000Z" and time as "10:30"
              const datePart = apt.date.split('T')[0]; // YYYY-MM-DD
              const start = new Date(`${datePart}T${apt.slotTime}:00`);
              const duration = apt.serviceId?.duration || 60; // Default to 60 min if missing
              const end = new Date(start.getTime() + duration * 60000);

              let title = "Appointment";
              if (apt.serviceId) title = apt.serviceId.name;
              if (apt.providerId && apt.providerId.userId) title += ` with ${apt.providerId.userId.name}`;

              return {
                  id: apt._id,
                  title,
                  start,
                  end,
                  status: apt.status,
                  resource: apt
              };
          });
          setEvents(calendarEvents);

      } catch (err) {
          console.error(err);
          toast.error("Failed to load dashboard data");
      } finally {
          setLoading(false);
      }
  };

  const handleCancel = async (id) => {
      if(!window.confirm("Are you sure you want to cancel this appointment?")) return;

      try {
          await axios.put(`/appointments/${id}/cancel`);
          toast.success("Appointment cancelled");
          fetchData(); // Refresh data
      } catch (err) {
          toast.error("Failed to cancel appointment");
      }
  };

  const eventStyleGetter = (event) => {
      let backgroundColor = '#3B82F6'; // Blue default
      if (event.status === 'confirmed') backgroundColor = '#10B981'; // Green
      if (event.status === 'cancelled') backgroundColor = '#EF4444'; // Red
      if (event.status === 'pending') backgroundColor = '#F59E0B'; // Yellow

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

  const CustomEvent = ({ event }) => (
      <div className="text-xs">
          <strong>{event.title}</strong>
          <p>{event.status}</p>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="mt-2 text-indigo-100 opacity-90">Manage your schedule and bookings.</p>
        </div>
        <button onClick={fetchData} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
            <RefreshCw size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8">
        <button 
            className={`mr-8 pb-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'browse' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('browse')}
        >
            Browse Providers
        </button>
        <button 
            className={`pb-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'appointments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('appointments')}
        >
            My Calendar
        </button>
      </div>

      {activeTab === 'browse' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map(p => (
                <div key={p._id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                    <div className="p-6 flex-1">
                        <div className="flex items-center gap-4 mb-4">
                             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg">
                                 {p.userId?.name?.charAt(0) || 'P'}
                             </div>
                             <div>
                                 <h3 className="font-bold text-lg text-slate-900">{p.userId?.name}</h3>
                                 <div className="flex flex-wrap gap-1 mt-1">
                                    {p.services && p.services.length > 0 ? (
                                        p.services.slice(0, 3).map(s => (
                                            <span key={s._id} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium border border-indigo-100">
                                                {s.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">No services listed</span>
                                    )}
                                    {p.services && p.services.length > 3 && (
                                        <span className="text-xs text-slate-500 font-medium">+ {p.services.length - 3}</span>
                                    )}
                                 </div>
                             </div>
                        </div>
                        <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed">{p.bio || "No bio available."}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <Link to={`/book/${p._id}`} className="block w-full text-center bg-white border border-indigo-600 text-indigo-600 font-medium py-2 rounded-lg hover:bg-indigo-50 transition-colors">
                            Book Now
                        </Link>
                    </div>
                </div>
            ))}
            {providers.length === 0 && !loading && <div className="col-span-3 text-center py-12 text-slate-500">No providers found.</div>}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-[600px]">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                eventPropGetter={eventStyleGetter}
                components={{
                    event: CustomEvent
                }}
                onSelectEvent={(event) => {
                    if(event.status !== 'cancelled' && window.confirm(`Cancel appointment: ${event.title}?`)) {
                        handleCancel(event.id);
                    }
                }}
            />
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
