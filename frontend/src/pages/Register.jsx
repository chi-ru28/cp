import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'farmer' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const validatePassword = (pass) => {
        if (pass.length < 8) return false;
        if (!/[A-Z]/.test(pass)) return false;
        if (!/[a-z]/.test(pass)) return false;
        if (!/[0-9]/.test(pass)) return false;
        if (!/[@&*!]/.test(pass)) return false;
        return true;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validatePassword(formData.password)) {
            setError('Password must be at least 8 chars long with 1 uppercase, 1 lowercase, 1 number, and 1 special char (@ & * !)');
            return;
        }

        setIsLoading(true);
        const res = await register(formData.name, formData.email, formData.password, formData.role);
        if (res.success) {
            navigate('/chat');
        } else {
            setError(res.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-tr from-slate-100 to-agri-50">
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass max-w-md w-full rounded-3xl p-8 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-32 h-32 bg-agri-200/50 rounded-full blur-3xl -ml-16 -mt-16"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-agri-300/30 rounded-full blur-3xl -mr-16 -mb-16"></div>

                <div className="relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="h-16 w-16 bg-gradient-to-bl from-agri-400 to-agri-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                            <UserPlus className="text-white w-8 h-8 rotate-3" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Join AgriAssist</h2>
                    <p className="text-center text-slate-500 mb-8">Create your intelligent farming account</p>

                    {error && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 border border-red-100 text-sm font-medium">
                            <AlertCircle size={20} className="mt-0.5 shrink-0" />
                            <p>{error}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                            <input type="text" name="name" required className="input-field py-2.5" placeholder="John Doe" value={formData.name} onChange={handleChange} />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                            <input type="email" name="email" required className="input-field py-2.5" placeholder="farmer@example.com" value={formData.email} onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                                <select name="role" value={formData.role} onChange={handleChange} className="input-field py-2.5 bg-white cursor-pointer">
                                    <option value="farmer">Farmer</option>
                                    <option value="shopkeeper">Shopkeeper</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} name="password" required className="input-field py-2.5 pr-10" placeholder="••••••••" value={formData.password} onChange={handleChange} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="btn-primary w-full mt-6 py-3">
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-slate-600">
                        Already have an account? <Link to="/login" className="text-agri-600 font-semibold hover:underline">Log in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
