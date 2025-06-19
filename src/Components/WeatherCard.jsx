/**
 * WeatherCard Component - Weather Information Display and Integration
 * 
 * This component serves as the weather information hub, displaying current conditions
 * and integrating weather data with the music mood card. It combines real-time
 * weather data with appropriate visual icons and formatting.
 * 
 * Key Features:
 * - Real-time weather display with location information
 * - Live clock with 12-hour format
 * - Dynamic weather icons based on conditions and time of day
 * - Temperature display with "feels like" information
 * - Integration with music mood card component
 * - Comprehensive weather condition support
 * 
 * Technical Implementation:
 * - Uses Lucide React icons for consistent, scalable weather symbols
 * - Implements day/night logic for appropriate icon selection
 * - Real-time clock updates every second
 * - Error handling for missing weather data
 * - Responsive design for various screen sizes
 * 
 */

import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, MoonStar, CloudFog, Haze, Tornado, CloudDrizzle, CloudLightning, Snowflake } from 'lucide-react';
import Card from './Card';
import '../CSS/WeatherCard.css';

function WeatherCard ({ weatherData }){
    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================
    
    /**
     * Current time string in 12-hour format (e.g., "2:30 PM")
     * Updates every second to show live time
     */
    const [currentTime, setCurrentTime] = useState('');
    
    /**
     * Weather icon component based on current conditions
     * Dynamically selected from Lucide React icon set
     */
    const [icon, setIcon] = useState(null);

    // ========================================================================
    // EARLY RETURN FOR MISSING DATA
    // ========================================================================
    
    /**
     * Handle case where weather data isn't available yet
     * Shows loading message instead of crashing component
     */
    // Early return if no weather data
    if(!weatherData) {
        return (
            <div className="weather-container">
                <p>Loading weather data...</p>
            </div>
        );
    }

    // ========================================================================
    // DATA EXTRACTION AND PROCESSING
    // ========================================================================
    
    /**
     * Extract and process weather data from API response
     * Destructures complex weather object into usable variables
     * Rounds temperatures to whole numbers for cleaner display
     */
    const {
        name: cityName,
        main: {temp, feels_like},
        weather: [{main, description}],
    } = weatherData;

    // Process temperature values (round to integers)
    const temperature = Math.round(temp);
    const feelsLike = Math.round(feels_like);
    
    // Extract other weather information
    const city = cityName;
    const weatherDescription = description;
    const weatherMain = main;
    
    // ========================================================================
    // REAL-TIME CLOCK FUNCTIONALITY
    // ========================================================================
    
    /**
     * Set up real-time clock that updates every second
     * Formats time in 12-hour format with AM/PM indicator
     * 
     * Implementation details:
     * - Updates immediately on component mount
     * - Sets up interval for continuous updates
     * - Cleans up interval when component unmounts
     * - Handles midnight/noon edge cases properly
     */
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            let hours = now.getHours();
            let minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';

            // Convert to 12-hour format
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 should be 12

            // Add leading zero to minutes if needed
            minutes = minutes < 10 ? '0' + minutes : minutes;

            const timeString = `${hours}:${minutes} ${ampm}`;
            setCurrentTime(timeString);
        };

        // Update immediately and then every second
        updateTime();
        const interval = setInterval(updateTime, 1000);
        
        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, []);

    // ========================================================================
    // DYNAMIC WEATHER ICON SELECTION
    // ========================================================================
    
    /**
     * Select appropriate weather icon based on conditions and time of day
     * 
     * Icon Selection Logic:
     * 1. Maps weather conditions to appropriate Lucide React icons
     * 2. Considers time of day for clear weather (sun vs moon)
     * 3. Groups similar conditions (mist, smoke, fog all use CloudFog)
     * 4. Provides fallback for unknown conditions
     * 
     * Supported Weather Conditions:
     * - Precipitation: Rain, Drizzle, Snow, Thunderstorm
     * - Atmospheric: Mist, Smoke, Haze, Dust, Fog, Ash
     * - Extreme: Tornado
     * - Clear: Sun (day) or Moon (night)
     * - Cloudy: Standard cloud icon
     */
    useEffect(() => {
        // Determine if it's currently daytime (6 AM to 6 PM)
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
                    /**
                     * Special handling for clear weather
                     * Shows sun during day (6 AM - 6 PM) and moon at night
                     */
                    if(isDay){
                        setIcon(<Sun/>);
                    } else {
                        setIcon(<MoonStar/>);
                    } 
                    break;
                default: 
                    /**
                     * Fallback for unknown weather conditions
                     * Defaults to sun/moon based on time of day
                     */
                    if(isDay){
                        setIcon(<Sun/>);
                    } else {
                        setIcon(<MoonStar/>);
                    }
                    break;
            }
        };
        updateIcon();
    }, [weatherMain, weatherDescription]); // Re-run when weather changes

    // ========================================================================
    // COMPONENT RENDER
    // ========================================================================
    
    /**
     * Render complete weather card with two main sections:
     * 1. Weather Information Section - Current conditions and time
     * 2. Music Card Integration - Weather-based music mood recommendations
     * 
     * Layout Structure:
     * - City name prominently displayed
     * - Temperature information (actual and feels-like)
     * - Weather description with natural language
     * - Time and weather icon in footer
     * - Integrated music mood card below weather info
     */
    return (
        <div className="weather-container">
            {/* ============================================================ */}
            {/* WEATHER INFORMATION SECTION */}
            {/* ============================================================ */}
            <div className="weather-info-section">
                {/* City name header */}
                <div className="city-container">
                    <span className="city">{city}</span>
                </div>
                
                {/* Temperature information */}
                <div className="weather">
                    <span className="temp">Temp: {temperature}°F</span>
                    <span className="feels-like">Feels like: {feelsLike}°F</span>
                    <span className="weather-description">{description}</span>
                </div>
                
                {/* Time and weather icon */}
                <div className="weather-time-icon">
                    <span className="current-time">{currentTime}</span>
                    <span className="weather-icon">{icon}</span>
                </div>
            </div>

            {/* ============================================================ */}
            {/* MUSIC CARD INTEGRATION */}
            {/* ============================================================ */}
            <div className="music-card-integrated">
                {/* 
                    Integrate the Card component that shows music mood recommendations
                    Pass weather data to enable weather-based music suggestions
                */}
                <Card weatherData={weatherData} />
            </div>
        </div>
    )
}

export default WeatherCard