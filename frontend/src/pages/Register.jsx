import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, User, Mail, Lock, Phone } from "lucide-react";

const InputField = ({ label, icon: Icon, type, name, placeholder, value, onChange, error }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Icon size={18} />
      </div>
      <input 
        type={type} 
        name={name}
        className={`pl-10 block w-full rounded-lg border ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'} bg-white p-2.5 text-slate-900 shadow-sm sm:text-sm focus:outline-none focus:ring-2 transition-all`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
    {error && <p className="mt-1 text-sm text-red-600 flex items-center gap-1">⚠ {error}</p>}
  </div>
);

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    phone: "", 
    role: "user" 
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    // ... (validation logic remains same, but omitted for brevity in replace if not needed, but I need to keep it)
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    
    if (!formData.email) {
        newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Invalid email format";
    }

    if (!formData.phone) newErrors.phone = "Phone is required";
    
    if (!formData.password) {
        newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, formData.role, formData.phone);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      if(errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
        <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create an account</h2>
            <p className="mt-2 text-sm text-slate-600">Join us to book your next appointment</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <InputField 
            label="Full Name" 
            icon={User} 
            type="text" 
            name="name" 
            placeholder="John Doe" 
            value={formData.name} 
            onChange={handleChange}
            error={errors.name}
          />
          <InputField 
            label="Email Address" 
            icon={Mail} 
            type="email" 
            name="email" 
            placeholder="name@company.com" 
            value={formData.email} 
            onChange={handleChange}
            error={errors.email}
          />
          <InputField 
            label="Phone Number" 
            icon={Phone} 
            type="tel" 
            name="phone" 
            placeholder="+1 234 567 890" 
            value={formData.phone} 
            onChange={handleChange}
            error={errors.phone}
          />
          <InputField 
            label="Password" 
            icon={Lock} 
            type="password" 
            name="password" 
            placeholder="••••••••" 
            value={formData.password} 
            onChange={handleChange}
            error={errors.password}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">I want to...</label>
            <select 
              className="block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.role} 
              onChange={handleChange}
              name="role"
            >
              <option value="user">Book Appointments (User)</option>
              <option value="provider">Offer Services (Provider)</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg mt-6"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign Up"}
          </button>

          <p className="text-center text-sm text-slate-600 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
              Log in instead
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;


