// Elements
const cityNameEl = document.getElementById("city-name");
const hourlyTodayEl = document.getElementById("hourly-today");
const hourlyTomorrowEl = document.getElementById("hourly-tomorrow");
const dailyEl = document.getElementById("daily");
const searchBtn = document.getElementById("search-btn");
const locationBtn = document.getElementById("location-btn");
const cityInput = document.getElementById("city-input");

// On page load, try to detect location by IP
window.addEventListener("load", () => {
  detectLocationByIP();
});

// Manual city search
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) {
    getCoordinates(city);
  }
});

// Use Geolocation API from browser
locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        cityNameEl.textContent = `Your Location (Browser)`;
        fetchWeather(lat, lon);
      },
      () => {
        alert("Unable to access location or permission denied.");
      }
    );
  } else {
    alert("Your browser does not support Geolocation.");
  }
});

// --- Detect location by IP using ip-api.com ---
async function detectLocationByIP() {
  try {
    cityNameEl.textContent = "Detecting location by IP...";
    const res = await fetch("http://ip-api.com/json/?fields=status,message,city,country,lat,lon");
    const data = await res.json();
    if (data.status === "success") {
      cityNameEl.textContent = `${data.city}, ${data.country} (Based on IP)`;
      fetchWeather(data.lat, data.lon);
    } else {
      cityNameEl.textContent = "Unable to detect location by IP.";
    }
  } catch (err) {
    cityNameEl.textContent = "Error detecting location by IP.";
    console.error(err);
  }
}

// --- Get coordinates by city name using Open-Meteo Geocoding API ---
async function getCoordinates(city) {
  try {
    cityNameEl.textContent = "Searching for city...";
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    if (geoData.results && geoData.results.length > 0) {
      const { latitude, longitude, name, country } = geoData.results[0];
      cityNameEl.textContent = `${name}, ${country} (Searched)`;
      fetchWeather(latitude, longitude);
    } else {
      alert("City not found.");
      cityNameEl.textContent = "City not found.";
    }
  } catch (err) {
    console.error(err);
    cityNameEl.textContent = "Error searching for city.";
  }
}

// --- Fetch weather data ---
async function fetchWeather(lat, lon) {
  try {
    cityNameEl.textContent += " | Loading weather forecast...";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,windspeed_10m,weathercode&daily=temperature_2m_max,temperature_2m_min,windspeed_10m_max,weathercode&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    displayWeather(data);
  } catch (err) {
    console.error(err);
    cityNameEl.textContent = "Error fetching weather data.";
  }
}

// --- Interpret weather codes from Open-Meteo ---
function interpretWeatherCode(code) {
  const weatherCodes = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  return weatherCodes[code] || "Unknown";
}

// --- Display weather data ---
function displayWeather(data) {
  hourlyTodayEl.innerHTML = "";
  hourlyTomorrowEl.innerHTML = "";
  dailyEl.innerHTML = "";

  const times = data.hourly.time;
  const temps = data.hourly.temperature_2m;
  const winds = data.hourly.windspeed_10m;
  const codes = data.hourly.weathercode;

  const dailyTimes = data.daily.time;
  const dailyMaxTemps = data.daily.temperature_2m_max;
  const dailyMinTemps = data.daily.temperature_2m_min;
  const dailyWinds = data.daily.windspeed_10m_max;
  const dailyCodes = data.daily.weathercode;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Format date as yyyy-mm-dd
  function formatDate(date) {
    return date.toISOString().split("T")[0];
  }

  // Hourly forecast for today
  times.forEach((t, i) => {
    const d = t.split("T")[0];
    if (d === formatDate(today)) {
      const el = document.createElement("div");
      el.className = "hour-block";
      el.innerHTML = `
        <strong>${t.slice(11,16)}</strong><br>
        ${interpretWeatherCode(codes[i])}<br>
        🌡 ${temps[i]}°C<br>
        💨 ${winds[i]} km/h
      `;
      hourlyTodayEl.appendChild(el);
    }
  });

  // Hourly forecast for tomorrow
  times.forEach((t, i) => {
    const d = t.split("T")[0];
    if (d === formatDate(tomorrow)) {
      const el = document.createElement("div");
      el.className = "hour-block";
      el.innerHTML = `
        <strong>${t.slice(11,16)}</strong><br>
        ${interpretWeatherCode(codes[i])}<br>
        🌡 ${temps[i]}°C<br>
        💨 ${winds[i]} km/h
      `;
      hourlyTomorrowEl.appendChild(el);
    }
  });

  // 7-day forecast
  dailyTimes.forEach((d, i) => {
    const date = new Date(d);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const el = document.createElement("div");
    el.className = "day-block";
    el.innerHTML = `
      <strong>${dayName}</strong><br>
      <small>${date.toLocaleDateString("en-US")}</small><br>
      ${interpretWeatherCode(dailyCodes[i])}<br>
      ⬆ ${dailyMaxTemps[i]}°C<br>
      ⬇ ${dailyMinTemps[i]}°C<br>
      💨 ${dailyWinds[i]} km/h
    `;
    dailyEl.appendChild(el);
  });

  cityNameEl.textContent = cityNameEl.textContent.replace(/\| Loading weather forecast\.\.\./g, "");
}
