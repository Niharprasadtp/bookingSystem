import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const BookingPage = () => {
    const { providerId } = useParams();
    const { token } = useContext(AuthContext);
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

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchProviderDetails();
    }, [providerId]);
    
    const fetchProviderDetails = async () => {
        try {
            const res = await fetch(`${API_URL}/providers/${providerId}`);
            const data = await res.json();
            setProvider(data.provider);
            setServices(data.services);
        } catch (err) {
            console.error(err);
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
            const res = await fetch(`${API_URL}/appointments/slots?providerId=${providerId}&serviceId=${selectedService}&date=${date}`);
            const data = await res.json();
            setSlots(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async () => {
        if(!selectedSlot || !selectedService || !date) return;
        
        try {
            const res = await fetch(`${API_URL}/appointments/book`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    providerId,
                    serviceId: selectedService,
                    date,
                    slotTime: selectedSlot
                })
            });
            
            if(res.ok) {
                setMsg("Booking Confirmed!");
                setTimeout(() => navigate("/dashboard"), 2000); // Redirect to dashboard logic (which acts as a user dashboard too sort of)
            } else {
                setMsg("Booking failed. Try again.");
            }
        } catch (err) {
           setMsg("Error booking.");
        }
    };

    if (!provider) return <div className="p-8">Loading Provider...</div>;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg my-8">
            <h1 className="text-2xl font-bold mb-2">Book with {provider.userId?.name || "Provider"}</h1>
            <p className="text-gray-600 mb-6">{provider.bio || "No bio available."}</p>
            
            {msg && <div className="bg-green-100 text-green-700 p-3 mb-4 rounded">{msg}</div>}

            {/* Step 1: Service */}
            <div className="mb-6">
                <label className="block font-bold mb-2">1. Select Service</label>
                <select 
                    className="w-full border p-2 rounded" 
                    value={selectedService} 
                    onChange={e => setSelectedService(e.target.value)}
                >
                    <option value="">-- Choose a Service --</option>
                    {services.map(s => (
                        <option key={s._id} value={s._id}>{s.name} - ${s.price} ({s.duration} min)</option>
                    ))}
                </select>
            </div>

            {/* Step 2: Date */}
            <div className="mb-6">
                 <label className="block font-bold mb-2">2. Select Date</label>
                 <input 
                    type="date" 
                    className="w-full border p-2 rounded" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                 />
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
