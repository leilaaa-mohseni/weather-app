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

locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    cityInput.value = ""; // پاک کردن ورودی شهر همیشه وقتی می‌خوای موقعیت بگیری
    cityNameEl.textContent = "Getting your location...";
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        cityNameEl.textContent = `Your Location (Browser)`;
        fetchWeather(lat, lon);
      },
      (error) => {
        // پیام خطا واضح‌تر
        switch(error.code) {
          case error.PERMISSION_DENIED:
            alert("Permission to access location was denied.");
            cityNameEl.textContent = "Permission denied for location.";
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            cityNameEl.textContent = "Location unavailable.";
            break;
          case error.TIMEOUT:
            alert("Location request timed out.");
            cityNameEl.textContent = "Location request timed out.";
            break;
          default:
            alert("An unknown error occurred.");
            cityNameEl.textContent = "Unknown location error.";
            break;
        }
      }
    );
  } else {
    alert("Your browser does not support Geolocation.");
  }
});

function getWeekdayName(dateStr) {
  const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const date = new Date(dateStr);
  return daysEn[date.getDay()];
}

// --- Detect location by IP using ip-api.com ---
async function detectLocationByIP() {
  try {
    cityNameEl.textContent = "Detecting location by IP...";
    const res = await fetch("https://ip-api.com/json/?fields=status,message,city,country,lat,lon");
    const data = await res.json();
    if (data.status === "success") {
      cityInput.value = ""; // Clear manual input on successful IP detect
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
    99: "Thunderstorm with heavy hail",
  };
  return weatherCodes[code] || "Unknown";
}

// --- Display weather ---
function displayWeather(data) {
  // Clear old data
  hourlyTodayEl.innerHTML = "";
  hourlyTomorrowEl.innerHTML = "";
  dailyEl.innerHTML = "";

  // Dates
  const now = new Date();
  const todayISO = now.toISOString().split("T")[0];
  const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowISO = tomorrowDate.toISOString().split("T")[0];

  // Hourly data indexes
  const { hourly, daily } = data;

  // Split hourly data to today and tomorrow
  hourly.time.forEach((timeStr, idx) => {
    const datePart = timeStr.split("T")[0];
    const hourPart = timeStr.split("T")[1].slice(0, 5); // HH:MM

    const temp = hourly.temperature_2m[idx];
    const wind = hourly.windspeed_10m[idx];
    const code = hourly.weathercode[idx];
    const codeDesc = interpretWeatherCode(code);

    const hourBlock = document.createElement("div");
    hourBlock.className = "hour-block";
    hourBlock.innerHTML = `
      <div><strong>${hourPart}</strong></div>
      <div>${temp.toFixed(1)}°C</div>
      <div>Wind: ${wind.toFixed(1)} km/h</div>
      <div>${codeDesc}</div>
    `;

    if (datePart === todayISO) {
      hourlyTodayEl.appendChild(hourBlock);
    } else if (datePart === tomorrowISO) {
      hourlyTomorrowEl.appendChild(hourBlock);
    }
  });

  daily.time.forEach((dateStr, idx) => {
  const dayBlock = document.createElement("div");
  dayBlock.className = "day-block";

  const weekdayName = getWeekdayName(dateStr);

  dayBlock.innerHTML = `
    <div><strong>${weekdayName} (<span style="white-space: nowrap;">${dateStr}</span>)</strong></div>
    <div>⬆: ${daily.temperature_2m_max[idx].toFixed(1)}°C</div>
    <div>⬇: ${daily.temperature_2m_min[idx].toFixed(1)}°C</div>
    <div>Max Wind: ${daily.windspeed_10m_max[idx].toFixed(1)} km/h</div>
    <div>${interpretWeatherCode(daily.weathercode[idx])}</div>
  `;

  dailyEl.appendChild(dayBlock);
});
}
