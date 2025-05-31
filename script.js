const WEATHER_API_KEY = '2a6e5a0330954023b92200447253105';
const iranCities = [
    { name: "آذربایجان شرقی - تبریز", lat: 38.0962, lon: 46.2738 },
    { name: "آذربایجان غربی - ارومیه", lat: 37.5527, lon: 45.0759 },
    { name: "اردبیل - اردبیل", lat: 38.2493, lon: 48.2963 },
    { name: "اصفهان - اصفهان", lat: 32.6546, lon: 51.6680 },
    { name: "البرز - کرج", lat: 35.8400, lon: 50.9391 },
    { name: "ایلام - ایلام", lat: 33.2959, lon: 46.6705 },
    { name: "بوشهر - بوشهر", lat: 28.9234, lon: 50.8203 },
    { name: "تهران - تهران", lat: 35.6892, lon: 51.3890 },
    { name: "چهارمحال و بختیاری - شهرکرد", lat: 32.3256, lon: 50.8645 },
    { name: "خراسان جنوبی - بیرجند", lat: 32.8649, lon: 59.2262 },
    { name: "خراسان رضوی - مشهد", lat: 36.2605, lon: 59.6168 },
    { name: "خراسان شمالی - بجنورد", lat: 37.4751, lon: 57.3293 },
    { name: "خوزستان - اهواز", lat: 31.3183, lon: 48.6706 },
    { name: "زنجان - زنجان", lat: 36.6769, lon: 48.4963 },
    { name: "سمنان - سمنان", lat: 35.5729, lon: 53.3975 },
    { name: "سیستان و بلوچستان - زاهدان", lat: 29.4969, lon: 60.8629 },
    { name: "فارس - شیراز", lat: 29.5926, lon: 52.5836 },
    { name: "قزوین - قزوین", lat: 36.2797, lon: 50.0049 },
    { name: "قم - قم", lat: 34.6399, lon: 50.8759 },
    { name: "کردستان - سنندج", lat: 35.3219, lon: 46.9862 },
    { name: "کرمان - کرمان", lat: 30.2839, lon: 57.0834 },
    { name: "کرمانشاه - کرمانشاه", lat: 34.3142, lon: 47.0650 },
    { name: "کهگیلویه و بویراحمد - یاسوج", lat: 30.6685, lon: 51.5880 },
    { name: "گلستان - گرگان", lat: 36.8456, lon: 54.4393 },
    { name: "گیلان - رشت", lat: 37.2808, lon: 49.5832 },
    { name: "لرستان - خرم‌آباد", lat: 33.4871, lon: 48.3538 },
    { name: "مازندران - ساری", lat: 36.5633, lon: 53.0601 },
    { name: "مرکزی - اراک", lat: 34.0956, lon: 49.7009 },
    { name: "هرمزگان - بندرعباس", lat: 27.1836, lon: 56.2666 },
    { name: "همدان - همدان", lat: 34.7983, lon: 48.5146 },
    { name: "یزد - یزد", lat: 31.8974, lon: 54.3569 }
];

const detectByIpBtn = document.getElementById('detect-by-ip');
const detectByBrowserBtn = document.getElementById('detect-by-browser');
const citySelect = document.getElementById('city-select');
const detectedCityElement = document.getElementById('detected-city');
const currentCityElement = document.getElementById('current-city');
const currentTempElement = document.getElementById('current-temp');
const currentConditionElement = document.getElementById('current-condition');
const currentIconElement = document.getElementById('current-icon');
const windSpeedElement = document.getElementById('wind-speed');
const humidityElement = document.getElementById('humidity');
const todayHourlyElement = document.getElementById('today-hourly');
const tomorrowHourlyElement = document.getElementById('tomorrow-hourly');
const dailyForecastElement = document.getElementById('daily-forecast');
const loadingElement = document.getElementById('loading');
const errorModal = document.getElementById('error-modal');
const errorTitle = document.getElementById('error-title');
const errorMessage = document.getElementById('error-message');
const closeErrorModalBtn = document.getElementById('close-error-modal');

function populateCitySelect() {
    iranCities.forEach(city => {
        const option = document.createElement('option');
        option.value = `${city.lat},${city.lon}`;
        option.textContent = city.name;
        citySelect.appendChild(option);
    });
}

function showError(title, message) {
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    errorModal.style.display = 'flex';
}

closeErrorModalBtn.addEventListener('click', () => {
    errorModal.style.display = 'none';
});

async function detectLocationByIP() {
    showLoading();
    try {
        const response = await fetch(`http://ip-api.com/json/?fields=status,message,lat,lon,city,country`);
        const data = await response.json();
        
        if (data.status !== 'success') {
            throw new Error(data.message || 'خطا در دریافت موقعیت از IP');
        }
        
        findNearestCity(data.lat, data.lon);
    } catch (error) {
        console.error("Error detecting location by IP:", error);
        showError("خطا در تشخیص موقعیت", "خطا در تشخیص موقعیت با IP. لطفاً از روش دیگر استفاده کنید.");
        hideLoading();
    }
}
function getUserLocationByBrowser() {
    showLoading();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                findNearestCity(latitude, longitude);
            },
            (error) => {
                hideLoading();
                handleLocationError(error);
            },
            { timeout: 10000 } 
        );
    } else {
        hideLoading();
        showError("خطا", "مرورگر شما از قابلیت تشخیص موقعیت پشتیبانی نمی‌کند.");
    }
}

function findNearestCity(userLat, userLon) {
    let nearestCity = null;
    let minDistance = Infinity;

    iranCities.forEach(city => {
        const distance = calculateDistance(userLat, userLon, city.lat, city.lon);
        if (distance < minDistance) {
            minDistance = distance;
            nearestCity = city;
        }
    });

    if (nearestCity) {
         detectedCityElement.textContent = `نزدیک‌ترین مرکز استان: ${nearestCity.name}`;
        citySelect.value = `${nearestCity.lat},${nearestCity.lon}`;
        getWeatherData(`${nearestCity.lat},${nearestCity.lon}`);
    } else {
        hideLoading();
        showError("خطا", "خطا در یافتن نزدیک‌ترین شهر.");
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function getWeatherData(location) {
    try {
        const response = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${location}&days=7&aqi=no&alerts=no&lang=fa`
        );
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        displayWeatherData(data);
    } catch (error) {
        console.error("Error fetching weather data:", error);
        showError("خطا", "خطا در دریافت اطلاعات آب و هوا. لطفا دوباره تلاش کنید.");
    } finally {
        hideLoading();
    }
}

function displayWeatherData(data) {
    currentCityElement.textContent = data.location.name;
    currentTempElement.textContent = Math.round(data.current.temp_c);
    currentConditionElement.textContent = data.current.condition.text;
    currentIconElement.src = `https:${data.current.condition.icon}`;
    windSpeedElement.textContent = data.current.wind_kph;
    humidityElement.textContent = data.current.humidity;
    displayHourlyForecast(data.forecast.forecastday[0].hour, todayHourlyElement.querySelector('.hourly-container'));
    if (data.forecast.forecastday[1]) {
        displayHourlyForecast(data.forecast.forecastday[1].hour, tomorrowHourlyElement.querySelector('.hourly-container'));
    }
    displayDailyForecast(data.forecast.forecastday);
}

function displayHourlyForecast(hourlyData, container) {
    container.innerHTML = '';
    
    hourlyData.forEach(hour => {
        const time = new Date(hour.time);
        const hourItem = document.createElement('div');
        hourItem.className = 'hourly-item';
        hourItem.innerHTML = `
            <div>${time.getHours()}:00</div>
            <img src="https:${hour.condition.icon}" alt="${hour.condition.text}" width="40">
            <div>${Math.round(hour.temp_c)}°C</div>
            <div>${hour.condition.text}</div>
            <div><i class="fas fa-wind"></i> ${hour.wind_kph} km/h ${getWindDirection(hour.wind_degree)}</div>
        `;
        container.appendChild(hourItem);
    });
}

function getWindDirection(degree) {
    const directions = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
    const index = Math.round((degree % 360) / 45) % 8;
    return directions[index];
}

function displayDailyForecast(forecastData) {
    dailyForecastElement.innerHTML = '';
    
    forecastData.forEach(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('fa-IR', { weekday: 'long' });
        
        const dayItem = document.createElement('div');
        dayItem.className = 'daily-item';
        dayItem.innerHTML = `
            <div class="day">${dayName}</div>
            <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" width="30">
            <div class="condition">${day.day.condition.text}</div>
            <div class="temp">
                <span class="max-temp">${Math.round(day.day.maxtemp_c)}°</span>
                <span class="min-temp">${Math.round(day.day.mintemp_c)}°</span>
            </div>
        `;
        dailyForecastElement.appendChild(dayItem);
    });
}

function handleLocationError(error) {
    let errorMessage;
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = "دسترسی به موقعیت جغرافیایی رد شد. لطفا یک شهر را اتخاب کنید یا از مکان یابی با ip استفاده کنید.";
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = "اطلاعات موقعیت جغرافیایی در دسترس نیست.";
            break;
        case error.TIMEOUT:
            errorMessage = "دریافت موقعیت جغرافیایی زمان‌بر شد.";
            break;
        case error.UNKNOWN_ERROR:
            errorMessage = "خطای ناشناخته در دریافت موقعیت جغرافیایی.";
            break;
    }
    showError("خطا در موقعیت‌یابی", errorMessage);
}

function showLoading() {
    loadingElement.style.display = 'flex';
}

function hideLoading() {
    loadingElement.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    populateCitySelect();
    detectLocationByIP();
});

detectByIpBtn.addEventListener('click', detectLocationByIP);
detectByBrowserBtn.addEventListener('click', getUserLocationByBrowser);

citySelect.addEventListener('change', (e) => {
    if (e.target.value) {
        showLoading();
        getWeatherData(e.target.value);
    }
});
