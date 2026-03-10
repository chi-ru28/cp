const axios = require('axios');

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

const getWeather = async (location = 'Ranuj') => {
    if (!WEATHER_API_KEY) return 'Weather service not configured.';
    try {
        const url = `http://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${WEATHER_API_KEY}&units=metric`;
        const res = await axios.get(url, { timeout: 5000 });
        const { main, weather } = res.data;
        return `${location}: ${main.temp}°C, humidity ${main.humidity}%, ${weather[0].description}`;
    } catch (err) {
        return 'Weather service temporarily unavailable.';
    }
};

module.exports = { getWeather };
