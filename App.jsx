import Header from './Components/Header';
import Playlists from './Components/Playlists';
import Settings from './Components/Settings';
import Weather from './Components/WeatherCard';
import './CSS/App.css';
import { useState, useEffect } from 'react';
import { getWeather } from './services/api';
import { useWeatherTheme } from './services/weatherThemes';

function App() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [playlistSettings, setPlaylistSettings] = useState({
    playlistLength: 10,
    isExplicit: false
  });

  // Theme hook called at top level - ALWAYS executes
  const currentTheme = useWeatherTheme(weatherData);

  const updateSettings = (newSettings) => {
    setPlaylistSettings(newSettings);
  };

  // Theme useEffect BEFORE early returns - ALWAYS executes
  useEffect(() => {
    if (currentTheme) {
      // Add smooth transition
      document.body.style.transition = 'all 1s ease-in-out';
      
      // Log theme change for debugging
      console.log(`🌤️ Weather theme changed to: ${currentTheme.name} (${currentTheme.mood} mood)`);
    }
  }, [currentTheme]);

  // Get user location
  useEffect(() => {
    const getUserLocation = () => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          console.log('Location obtained:', coords);
          setLocation(coords);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Failed to get your location. Please allow location access.');
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000 // 10 minutes
        }
      );
    };

    getUserLocation();
  }, []);
  
  // Fetch weather data when location is available
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!location) return;

      try {
        setLoading(true);
        setError(null);
        const weather = await getWeather(location.latitude, location.longitude);
        setWeatherData(weather);
        console.log('Weather data:', weather);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Failed to fetch weather data');
        setWeatherData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [location]);

  // Get weather class for animated background
  const getWeatherClass = () => {
    if (!weatherData || !weatherData.weather || !weatherData.weather[0]) return '';
    
    const currentHour = new Date().getHours();
    const isDay = currentHour >= 6 && currentHour < 18;
    const weatherMain = weatherData.weather[0].main.toLowerCase();
    
    if (weatherMain === 'clear') {
      return isDay ? 'weather-clear-day' : 'weather-clear-night';
    }
    
    return `weather-${weatherMain}`;
  };

  // IMPROVED loading state with proper CSS classes
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading weather data...</p>
        <small>Getting your location and weather information...</small>
      </div>
    );
  }

  // IMPROVED error state with retry functionality
  if (error) {
    return (
      <div className="error-container">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button 
          onClick={() => {
            setError(null);
            setLoading(true);
            window.location.reload();
          }} 
          className="retry-btn"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Don't render main app until we have weather data
  if (!weatherData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Processing weather data...</p>
        <small>Almost ready...</small>
      </div>
    );
  }

  // Main app render with new layout structure
  return (
    <div className="app-container fade-in">
      {/* Debug theme indicator */}
      {currentTheme && process.env.NODE_ENV === 'development' && (
        <div className="theme-indicator">
          <small>
            🎨 Current mood: <strong>{currentTheme.mood}</strong> 
            ({currentTheme.name} theme)
          </small>
        </div>
      )}

      {/* Header Section - Title centered, Spotify button right */}
      <div className="header-section">
        <div className="header-title">
          <h1>WeatherBeats</h1>
        </div>
        <div className="header-actions">
          <Header />
        </div>
      </div>

      {/* Weather Section with Animated Background - includes Music Card */}
      <div className={`weather-section ${getWeatherClass()}`}>
        <div className="weather-background"></div>
        <div className="weather-content">
          <Weather weatherData={weatherData} />
        </div>
      </div>

      {/* Bottom Section - Playlist and Settings */}
      <div className="bottom-section">
        <div className="playlist-section">
          <Playlists 
            weatherData={weatherData}
            playlistSettings={playlistSettings}
          />
        </div>
        <div className="settings-section">
          <Settings 
            settings={playlistSettings}
            onSettingsChange={updateSettings}
          />
        </div>
      </div>
    </div>
  );
}

export default App;