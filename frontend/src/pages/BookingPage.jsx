import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import axios from "../api/axios";
import toast from "react-hot-toast";

const BookingPage = () => {
    const { providerId } = useParams();
    const navigate = useNavigate();
    
    // State
    const [provider, setProvider] = useState(null);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState("");
    const [date, setDate] = useState("");
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        fetchProviderDetails();
    }, [providerId]);
    
    const fetchProviderDetails = async () => {
        try {
            const res = await axios.get(`/providers/${providerId}`);
            setProvider(res.data.provider);
            setServices(res.data.services);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load provider details");
        }
    };

    // Fetch Slots when Date or Service changes
    useEffect(() => {
        if (selectedService && date) {
            fetchSlots();
        }
    }, [selectedService, date]);

    const fetchSlots = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/appointments/slots`, {
                params: { providerId, serviceId: selectedService, date }
            });
            setSlots(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load slots");
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async () => {
        if(!selectedSlot || !selectedService || !date) return;
        
        try {
            await axios.post('/appointments/book', {
                providerId,
                serviceId: selectedService,
                date,
                slotTime: selectedSlot
            });
            
            setMsg("Booking Confirmed!");
            toast.success("Booking Confirmed!");
            setTimeout(() => navigate("/dashboard"), 2000); 
        } catch (err) {
           const message = err.response?.data?.message || "Error booking.";
           setMsg(message);
           toast.error(message);
        }
    };

    if (!provider) return <div className="p-8">Loading Provider...</div>;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg my-8">
            <h1 className="text-2xl font-bold mb-2">Book with {provider.userId?.name || "Provider"}</h1>
            <p className="text-gray-600 mb-6">{provider.bio || "No bio available."}</p>
            
            {msg && <div className="bg-green-100 text-green-700 p-3 mb-4 rounded">{msg}</div>}

            {msg && <div className="bg-green-100 text-green-700 p-3 mb-4 rounded">{msg}</div>}

            {/* Step 1: Service */}
            <div className="mb-8">
                <label className="block font-bold mb-4 text-lg text-slate-800">1. Select Service</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {services.map(s => (
                        <div 
                            key={s._id} 
                            onClick={() => setSelectedService(s._id)}
                            className={`cursor-pointer border-2 rounded-xl p-4 transition-all hover:shadow-md ${selectedService === s._id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold ${selectedService === s._id ? 'text-indigo-900' : 'text-slate-900'}`}>{s.name}</h3>
                                {selectedService === s._id && <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-full">Selected</span>}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span>${s.price}</span>
                                <span>•</span>
                                <span>{s.duration} mins</span>
                            </div>
                        </div>
                    ))}
                </div>
                {services.length === 0 && <p className="text-slate-500 italic">No services available.</p>}
            </div>

            {/* Step 2: Date */}
            <div className="mb-8">
                 <label className="block font-bold mb-2 text-lg text-slate-800">2. Select Date</label>
                 <input 
                    type="date" 
                    className={`w-full border-2 p-3 rounded-lg outline-none transition-colors ${!selectedService ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    disabled={!selectedService}
                    min={new Date().toISOString().split('T')[0]}
                 />
                 {!selectedService && <p className="text-sm text-slate-500 mt-1">Please select a service first.</p>}
            </div>

            {/* Step 3: Slots */}
            {selectedService && date && (
                <div className="mb-8">
                    <label className="block font-bold mb-2">3. Available Slots</label>
                    {loading ? <p>Loading slots...</p> : (
                        <div className="grid grid-cols-4 gap-3">
                            {slots.length > 0 ? slots.map(slot => (
                                <button 
                                    key={slot}
                                    className={`p-2 rounded border text-sm ${selectedSlot === slot ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    onClick={() => setSelectedSlot(slot)}
                                >
                                    {slot}
                                </button>
                            )) : <p className="text-red-500 col-span-4">No slots available for this date.</p>}
                        </div>
                    )}
                </div>
            )}

            <button 
                disabled={!selectedSlot}
                className={`w-full py-3 rounded font-bold text-white ${selectedSlot ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'}`}
                onClick={handleBook}
            >
                Confirm Booking
            </button>
        </div>
    );
};

export default BookingPage;
