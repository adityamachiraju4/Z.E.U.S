import React, { useState, useEffect } from 'react';

const DEFAULT_LAT = '17.3850';
const DEFAULT_LON = '78.4867';
const DEFAULT_CITY = 'HYDERABAD';

const getWeatherDesc = (code) => {
  if (code === 0) return { desc: 'CLEAR SKY', icon: '☀️' };
  if (code <= 2) return { desc: 'PARTLY CLOUDY', icon: '⛅' };
  if (code === 3) return { desc: 'OVERCAST', icon: '☁️' };
  if (code <= 49) return { desc: 'FOG', icon: '🌫' };
  if (code <= 59) return { desc: 'DRIZZLE', icon: '🌦' };
  if (code <= 69) return { desc: 'RAIN', icon: '🌧' };
  if (code <= 79) return { desc: 'SNOW', icon: '❄️' };
  if (code <= 82) return { desc: 'RAIN SHOWERS', icon: '🌧' };
  if (code <= 99) return { desc: 'THUNDERSTORM', icon: '⛈' };
  return { desc: 'UNKNOWN', icon: '🌐' };
};

async function getCityName(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const data = await res.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      'UNKNOWN'
    ).toUpperCase();
  } catch {
    return DEFAULT_CITY;
  }
}

function Weather() {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async (lat, lon, cityName) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=kmh`
        );
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();
        const c = data.current;
        const { desc, icon } = getWeatherDesc(c.weather_code);
        setCity(cityName);
        setWeather({
          temp: Math.round(c.temperature_2m),
          feels: Math.round(c.apparent_temperature),
          humidity: c.relative_humidity_2m,
          wind: Math.round(c.wind_speed_10m),
          condition: desc,
          icon,
        });
      } catch (e) {
        console.error('Weather error:', e);
        setError(true);
      }
    };

    const init = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            const cityName = await getCityName(latitude, longitude);
            fetchWeather(latitude, longitude, cityName);
          },
          () => {
            // Permission denied — fall back to Hyderabad
            fetchWeather(DEFAULT_LAT, DEFAULT_LON, DEFAULT_CITY);
          }
        );
      } else {
        fetchWeather(DEFAULT_LAT, DEFAULT_LON, DEFAULT_CITY);
      }
    };

    init();
    const interval = setInterval(init, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (error) return null;
  if (!weather) return (
    <div className="weather-panel">
      <span className="weather-loading">ACQUIRING ATMOSPHERIC DATA...</span>
    </div>
  );

  return (
    <div className="weather-panel">
      <div className="weather-top">
        <span className="weather-icon">{weather.icon}</span>
        <div className="weather-main">
          <span className="weather-temp">{weather.temp}°C</span>
          <span className="weather-city">{city}</span>
        </div>
        <span className="weather-condition">{weather.condition}</span>
      </div>
      <div className="weather-stats">
        <span>FEELS {weather.feels}°C</span>
        <span className="weather-divider">|</span>
        <span>HUM {weather.humidity}%</span>
        <span className="weather-divider">|</span>
        <span>WIND {weather.wind} KM/H</span>
      </div>
    </div>
  );
}

export default Weather;