import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, MoonStar, CloudFog, Haze, Tornado, CloudDrizzle, CloudLightning, Snowflake } from 'lucide-react';
import Card from './Card';
import '../CSS/WeatherCard.css';

function WeatherCard ({ weatherData }){
    const [currentTime, setCurrentTime] = useState('');
    const [icon, setIcon] = useState(null);

    // Early return if no weather data
    if(!weatherData) {
        return (
            <div className="weather-container">
                <p>Loading weather data...</p>
            </div>
        );
    }

    const {
        name: cityName,
        main: {temp, feels_like},
        weather: [{main, description}],
    } = weatherData;

    const temperature = Math.round(temp);
    const feelsLike = Math.round(feels_like);
    const city = cityName;
    const weatherDescription = description;
    const weatherMain = main;
    
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            let hours = now.getHours();
            let minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';

            hours = hours % 12;
            hours = hours ? hours : 12;

            minutes = minutes < 10 ? '0' + minutes : minutes;

            const timeString = `${hours}:${minutes} ${ampm}`;
            setCurrentTime(timeString);
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const currentHour = new Date().getHours();
        const isDay = currentHour >= 6 && currentHour < 18;

        const updateIcon = () => {
            switch (weatherMain.toLowerCase()) {
                case 'rain':
                    setIcon(<CloudRain/>);
                    break;
                case 'drizzle':
                    setIcon(<CloudDrizzle/>);
                    break;
                case 'thunderstorm':
                    setIcon(<CloudLightning/>);
                    break;
                case 'snow':
                    setIcon(<Snowflake/>);
                    break;
                case 'clouds':
                    setIcon(<Cloud/>);
                    break;
                case 'mist':
                    setIcon(<CloudFog/>);
                    break;
                case 'smoke':
                    setIcon(<CloudFog/>);
                    break;
                case 'haze':
                    setIcon(<Haze/>);
                    break;
                case 'dust':
                    setIcon(<Haze/>);
                    break;
                case 'fog':
                    setIcon(<CloudFog/>);
                    break;
                case 'ash':
                    setIcon(<Haze/>);
                    break;
                case 'tornado':
                    setIcon(<Tornado/>);
                    break;
                case 'clear':
                    if(isDay){
                        setIcon(<Sun/>);
                    } else {
                        setIcon(<MoonStar/>);
                    } 
                    break;
                default: 
                    if(isDay){
                        setIcon(<Sun/>);
                    } else {
                        setIcon(<MoonStar/>);
                    }
                    break;
            }
        };
        updateIcon();
    }, [weatherMain, weatherDescription]);

    return (
        <div className="weather-container">
            {/* Weather Information Section */}
            <div className="weather-info-section">
                <div className="city-container">
                    <span className="city">{city}</span>
                </div>
                <div className="weather">
                    <span className="temp">Temp: {temperature}°F</span>
                    <span className="feels-like">Feels like: {feelsLike}°F</span>
                    <span className="weather-description">{description}</span>
                </div>
                <div className="weather-time-icon">
                    <span className="current-time">{currentTime}</span>
                    <span className="weather-icon">{icon}</span>
                </div>
            </div>

            {/* Music Card Section*/}
            <div className="music-card-integrated">
                <Card weatherData={weatherData} />
            </div>
        </div>
    )
}

export default WeatherCard