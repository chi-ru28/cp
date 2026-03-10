import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, loginWithAuth0, signupWithAuth0 } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const res = await login(email, password);
        if (res.success) {
            navigate('/chat');
        } else {
            setError(res.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-agri-50 to-slate-100">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass max-w-md w-full rounded-3xl p-8 relative overflow-hidden"
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-agri-200/50 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-agri-300/30 rounded-full blur-3xl -ml-16 -mb-16"></div>

                <div className="relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="h-16 w-16 bg-gradient-to-br from-agri-400 to-agri-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                            <Sprout className="text-white w-8 h-8 -rotate-3" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Welcome Back</h2>
                    <p className="text-center text-slate-500 mb-8">Login to continue your agricultural journey</p>

                    {error && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
                            <AlertCircle size={20} />
                            <p className="text-sm font-medium">{error}</p>
                        </motion.div>
                    )}

                    {/* ── Email / Password Form ──────────────────────────── */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                className="input-field"
                                placeholder="farmer@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="input-field pr-12"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full mt-6"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    {/* ── Auth0 Social / Universal Login ─────────────────── */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-slate-200"></div>
                        <span className="text-sm text-slate-400 font-medium">or continue with</span>
                        <div className="flex-1 h-px bg-slate-200"></div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={loginWithAuth0}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-slate-200 bg-white hover:border-agri-400 hover:bg-agri-50 transition-all duration-200 font-semibold text-slate-700 shadow-sm"
                        >
                            {/* Auth0 logo */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" fill="#EB5424"/>
                                <path d="M8 8h8l-4 8-4-8z" fill="white"/>
                            </svg>
                            Continue with Auth0
                        </button>

                        <button
                            onClick={signupWithAuth0}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-slate-200 bg-white hover:border-agri-400 hover:bg-agri-50 transition-all duration-200 font-semibold text-slate-700 shadow-sm"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" fill="#EB5424"/>
                                <path d="M8 8h8l-4 8-4-8z" fill="white"/>
                            </svg>
                            Sign up with Auth0
                        </button>
                    </div>
                    {/* ────────────────────────────────────────────────────── */}

                    <p className="text-center mt-8 text-slate-600">
                        Don't have an account? <Link to="/register" className="text-agri-600 font-semibold hover:underline">Register here</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
