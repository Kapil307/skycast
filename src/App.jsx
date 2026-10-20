
import { useState,useEffect } from "react";
import "./App.css";

function App() {
  const [city, setCity] = useState("Delhi");
  const [weather, setWeather] = useState(null);
  const [hourly, setHourly] = useState(null);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
  getWeather({ preventDefault: () => {} });
}, []);

  async function getWeather(e) {
    e.preventDefault();

    if (city.trim() === "") {
      setError("Please enter a city name.");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      // Find the city
      const cityResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
      );

      if (!cityResponse.ok) {
        throw new Error("Unable to search for this city.");
      }

      const cityData = await cityResponse.json();

      if (!cityData.results) {
        throw new Error("City not found. Try another name.");
      }

      const location = cityData.results[0];

      // Get weather data
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
      );

      if (!weatherResponse.ok) {
        throw new Error("Unable to get weather data.");
      }

      const data = await weatherResponse.json();

      setWeather({
        ...data.current,
        city: location.name,
        country: location.country,
      });

      setHourly(data.hourly);
      setDaily(data.daily);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Network error. Check your internet connection."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  function getCondition(code) {
    if (code === 0) return "Clear Sky";
    if (code <= 3) return "Cloudy";
    if (code <= 48) return "Foggy";
    if (code <= 67) return "Rainy";
    if (code <= 77) return "Snowy";
    if (code <= 82) return "Rain Showers";
    if (code >= 95) return "Thunderstorm";
    return "Variable Weather";
  }

  return (
    <div className="app">
      <header>
        <h1>🌤️ SkyCast</h1>
        <p>Simple Weather Forecast</p>
      </header>

      <form onSubmit={getWeather} className="search">
        <input
          type="text"
          placeholder="Enter city name..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          Search
        </button>
      </form>

      {loading && (
  <div className="loading-card">
    <div className="weather-loader">
      <div className="loader-orbit"></div>
      <div className="loader-sun">☀</div>
      <div className="loader-cloud">☁</div>
    </div>

    <h2>Forecasting your sky</h2>
    <p>Gathering weather data</p>

    <div className="loading-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
)}

      {error && <p className="error">{error}</p>}

      {weather && !loading && (
        <>
          <section className="weather-card">
            <h2>
              {weather.city}, {weather.country}
            </h2>

            <div className="temperature">
              {Math.round(weather.temperature_2m)}°C
            </div>

            <h3>{getCondition(weather.weather_code)}</h3>

            <div className="details">
              <p>
                💧 Humidity
                <strong>{weather.relative_humidity_2m}%</strong>
              </p>

              <p>
                💨 Wind
                <strong>{weather.wind_speed_10m} km/h</strong>
              </p>
            </div>
          </section>

          <section className="forecast">
            <h2>Hourly Forecast</h2>

            <div className="hourly">
              {hourly.time.slice(0, 24).map((time, index) => (
                <div className="hour" key={time}>
                  <p>
                    {new Date(time).toLocaleTimeString([], {
                      hour: "numeric",
                    })}
                  </p>

                  <strong>
                    {Math.round(hourly.temperature_2m[index])}°C
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <section className="forecast">
            <h2>7-Day Forecast</h2>

            {daily.time.map((date, index) => (
              <div className="day" key={date}>
                <strong>
                  {new Date(date + "T12:00:00").toLocaleDateString(
                    "en",
                    { weekday: "long" }
                  )}
                </strong>

                <span>
                  {Math.round(daily.temperature_2m_min[index])}°C –{" "}
                  {Math.round(daily.temperature_2m_max[index])}°C
                </span>
              </div>
            ))}
          </section>
        </>
      )}

      <footer>
        Weather data by{" "}

          Open-Meteo
        
      </footer>
    </div>
  );
}

export default App;
