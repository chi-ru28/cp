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

    const getPasswordStrength = (pass) => {
        if (!pass) return { score: 0, label: '', color: '' };
        let score = 0;
        if (pass.length >= 8) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[a-z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[!@#\$%\^&\*\(\)_\+\-=\[\]\{\}\|;:",\.<>\?/~`]/.test(pass)) score += 1;
        
        if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
        if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
        return { score, label: 'Strong', color: 'bg-green-500' };
    };

    const strength = getPasswordStrength(formData.password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (strength.label === 'Weak' || strength.label === 'Medium') {
            alert(`Your password is ${strength.label}. Please use a stronger password (8+ chars, upper, lower, number, special).`);
            if (strength.score < 5) return;
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

    const ShowIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" height="15.6px" viewBox="0 -960 960 960" width="15.6px" fill="#64748b">
            <path d="M160-440q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35ZM80-200v-80h800v80H80Zm315-275q-35-35-35-85t35-85q35-35 85-35t85 35q35 35 35 85t-35 85q-35 35-85 35t-85-35Zm320 0q-35-35-35-85t35-85q35-35 85-35t85 35q35 35 35 85t-35 85q-35 35-85 35t-85-35Z"/>
        </svg>
    );

    const HideIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" height="15.6px" viewBox="0 -960 960 960" width="15.6px" fill="#64748b">
            <path d="M160-440q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Zm555-35q-35-35-35-85t35-85q35-35 85-35t85 35q35 35 35 85t-35 85q-35 35-85 35t-85-35Zm-135-19L414-660q14-10 31-15t35-5q50 0 85 35t35 85q0 18-5 35t-15 31ZM792-56 648-200H80v-80h488L56-792l56-56 736 736-56 56Z"/>
        </svg>
    );

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

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                                <select name="role" value={formData.role} onChange={handleChange} className="input-field py-2.5 bg-white cursor-pointer w-full">
                                    <option value="farmer">Farmer</option>
                                    <option value="shopkeeper">Shopkeeper</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} name="password" required className="input-field py-2.5 pr-10 w-full" placeholder="••••••••" value={formData.password} onChange={handleChange} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600">
                                        {showPassword ? <HideIcon /> : <ShowIcon />}
                                    </button>
                                </div>
                                {formData.password && (
                                    <div className="mt-2 text-xs font-medium">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-slate-500">Strength:</span>
                                            <span className={strength.label === 'Strong' ? 'text-green-600' : strength.label === 'Medium' ? 'text-yellow-600' : 'text-red-600'}>
                                                {strength.label}
                                            </span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(strength.score / 5) * 100}%` }}
                                                className={`h-full ${strength.color}`} 
                                            />
                                        </div>
                                    </div>
                                )}
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
