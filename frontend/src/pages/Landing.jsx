import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sprout, MessageSquare, Sun, ShieldCheck, ArrowRight } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-slate-50 overflow-hidden">
            {/* Navbar Stub */}
            <nav className="fixed top-0 w-full z-50 glass border-b-0 border-white/40">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-agri-500 to-agri-600 rounded-xl flex items-center justify-center shadow-lg shadow-agri-500/30">
                            <Sprout className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-agri-700 to-slate-800">AgriAssist</span>
                    </div>
                    <div className="flex gap-4">
                        <Link to="/login" className="px-5 py-2.5 font-semibold text-slate-600 hover:text-agri-600 transition-colors">Log In</Link>
                        <Link to="/register" className="btn-primary py-2.5">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-16 px-6 max-w-7xl mx-auto min-h-screen flex items-center">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-agri-100 text-agri-700 font-medium mb-6">
                            <span className="w-2 h-2 rounded-full bg-agri-500 animate-pulse"></span>
                            Smart Farming Powered by AI
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight mb-6">
                            Grow smarter, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-agri-500 to-green-600">farm better.</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-8 max-w-lg leading-relaxed">
                            Your intelligent companion for fertilizer advice, soil analysis, and agriculture tool recommendations in your local language.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/register" className="btn-primary text-lg px-8 flex items-center gap-2">
                                Start Chatting Free <ArrowRight size={20} />
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative"
                    >
                        {/* Visual Abstract Graphic replacing the missing image */}
                        <div className="relative w-full aspect-square max-w-lg mx-auto">
                            <div className="absolute inset-0 bg-gradient-to-tr from-agri-200 to-emerald-100 rounded-full blur-3xl opacity-60 animate-pulse-slow"></div>
                            <div className="absolute inset-4 glass rounded-3xl z-10 p-8 shadow-2xl flex flex-col justify-between overflow-hidden border-white/50">
                                <div className="w-full flex justify-end">
                                    <div className="bg-agri-100 text-agri-800 px-4 py-2 rounded-2xl rounded-tr-none text-sm font-medium shadow-sm max-w-[80%]">
                                        How much Urea should I use for 2 acres of Wheat?
                                    </div>
                                </div>
                                <div className="w-full flex justify-start mt-4">
                                    <div className="bg-gradient-to-r from-agri-500 to-agri-600 text-white px-5 py-4 rounded-3xl rounded-tl-none shadow-md max-w-[90%]">
                                        <p className="font-medium text-sm">For 2 acres of Wheat, you typically need about 100-110 kg of Urea applied in 2-3 split doses...</p>
                                    </div>
                                </div>

                                {/* Floating Badges */}
                                <div className="absolute top-1/2 -left-6 glass px-4 py-3 rounded-2xl flex items-center gap-3 shadow-xl transform -translate-y-1/2">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Sun size={20} /></div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold">Weather</p>
                                        <p className="font-bold text-slate-800 text-sm">32°C, Sunny</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Landing;
