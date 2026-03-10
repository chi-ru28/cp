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
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full text-xs text-blue-400 animate-pulse">
            <Cloud size={14} /> {t('weatherLoading')}
        </div>
    );

    if (!weather) return null;

    return (
        <div className="flex items-center gap-3 px-3 py-1.5 bg-gradient-to-r from-sky-50 to-blue-50 rounded-full border border-sky-100 text-xs text-slate-600">
            <img
                src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
                alt={weather.condition}
                className="w-6 h-6"
            />
            <span className="font-bold text-slate-700">{weather.temp}°C</span>
            <span className="text-slate-400 capitalize hidden sm:inline">{weather.condition}</span>
            <span className="flex items-center gap-1 text-blue-500">
                <Droplets size={11} /> {weather.humidity}%
            </span>
            <span className="flex items-center gap-1 text-slate-400 hidden md:flex">
                <Wind size={11} /> {weather.wind}m/s
            </span>
        </div>
    );
};

export default WeatherWidget;
