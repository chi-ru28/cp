const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const axios = require('axios');

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

const getFarmingAdvice = (data) => {
    const { main, weather, wind } = data;
    const advices = [];
    if (main.humidity > 85) advices.push('High humidity — risk of fungal diseases. Avoid spraying foliar fertilizers.');
    if (main.humidity < 30) advices.push('Low humidity — increase irrigation frequency.');
    if (wind.speed > 20) advices.push('High wind speed — avoid pesticide spraying today.');
    if (main.temp > 38) advices.push('Very hot — irrigate in early morning or evening to reduce evaporation.');
    if (main.temp < 10) advices.push('Cold temperature — delay transplanting of sensitive crops.');
    if (weather[0].main === 'Rain') advices.push('Rainfall expected — hold off fertilizer application to prevent run-off.');
    if (!advices.length) advices.push('Good farming conditions today.');
    return advices;
};

// GET /api/weather?location=Ahmedabad
router.get('/', protect, async (req, res) => {
    const { location = 'Ahmedabad' } = req.query;
    if (!WEATHER_API_KEY) return res.status(503).json({ message: 'Weather service not configured.' });

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${WEATHER_API_KEY}&units=metric`;
        const { data } = await axios.get(url, { timeout: 6000 });

        res.json({
            location: data.name,
            country: data.sys.country,
            temp: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            wind: data.wind.speed,
            condition: data.weather[0].description,
            icon: data.weather[0].icon,
            farmingAdvice: getFarmingAdvice(data),
        });
    } catch (err) {
        console.error('Weather error:', err.message);
        res.status(502).json({ message: 'Weather service temporarily unavailable.', location });
    }
});

module.exports = router;
