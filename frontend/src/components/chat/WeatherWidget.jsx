import React, { useState, useEffect } from 'react';
import { Cloud, Wind, Droplets } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const WeatherWidget = ({ location = 'Ahmedabad' }) => {
    const { t } = useTranslation();
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const res = await api.get(`/weather?location=${encodeURIComponent(location)}`);
                setWeather(res.data);
            } catch { /* silent fail */ } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, [location]);

    if (loading) return (
        <div className="flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse border border-white/40 shadow-sm">
            <Cloud size={14} className="text-agri-400" /> {t('weatherLoading')}
        </div>
    );

    if (!weather) return null;

    return (
        <motion.div 
            whileHover={{ y: -1 }}
            className="flex items-center gap-4 px-4 py-2.5 bg-white/60 backdrop-blur-xl rounded-[1.25rem] border border-white/80 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-premium group"
        >
            <div className="relative">
                <img
                    src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
                    alt={weather.condition}
                    className="w-7 h-7 filter drop-shadow-md group-hover:scale-110 transition-transform"
                />
                <div className="absolute inset-0 bg-agri-400/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="flex flex-col">
                <span className="font-black text-slate-800 text-xs leading-none">
                    {weather.temp}°<span className="text-[10px] text-slate-400">C</span>
                </span>
                <span className="text-[8px] text-agri-500 mt-0.5">{weather.condition}</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-100 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-blue-500">
                    <Droplets size={12} strokeWidth={2.5} /> {weather.humidity}%
                </span>
                <span className="flex items-center gap-1.5 text-slate-400 hidden lg:flex">
                    <Wind size={12} strokeWidth={2.5} /> {weather.wind}m/s
                </span>
            </div>
        </motion.div>
    );
};

export default WeatherWidget;
