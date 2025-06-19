/**
 * WeatherBeats Application - Main Controller Component
 * 
 * This is the root component that orchestrates the entire WeatherBeats application.
 * It manages the core application lifecycle including geolocation services,
 * weather data fetching, dynamic theming, and component coordination.
 * 
 * Key Responsibilities:
 * - Geolocation acquisition and management
 * - Weather data fetching and state management
 * - Dynamic theme system based on weather conditions
 * - Application-wide error handling and loading states
 * - Component orchestration and data flow management
 * - User settings management and persistence
 * 
 * Architecture:
 * The component follows a centralized state management pattern where all
 * critical application data flows through this root component and is
 * distributed to child components via props. This ensures predictable
 * data flow and centralized error handling.
 * 
 * Data Flow:
 * 1. User location → Weather API → Weather data
 * 2. Weather data → Theme system → Dynamic styling
 * 3. Weather data + Settings → Playlist generation
 * 4. User preferences → Settings → Playlist customization
 * 
 */

import Header from './Components/Header';
import Playlists from './Components/Playlists';
import Settings from './Components/Settings';
import Weather from './Components/WeatherCard';
import './CSS/App.css';
import { useState, useEffect } from 'react';
import { getWeather } from './services/api';
import { useWeatherTheme } from './services/weatherThemes';

function App() {
  // ============================================================================
  // CORE APPLICATION STATE MANAGEMENT
  // ============================================================================
  
  /**
   * User's geographic location coordinates
   * 
   * Essential for weather data retrieval. Contains latitude and longitude
   * obtained from the browser's Geolocation API. This data drives the
   * entire application experience by determining weather conditions.
   * 
   * @type {Object|null} - {latitude: number, longitude: number} or null
   */
  const [location, setLocation] = useState(null);
  
  /**
   * Application loading state
   * 
   * Controls the display of loading interfaces during asynchronous operations
   * including geolocation acquisition and weather data fetching. Provides
   * user feedback during potentially slow operations.
   * 
   * @type {boolean}
   */
  const [loading, setLoading] = useState(true);
  
  /**
   * Application-wide error state
   * 
   * Manages error conditions from various sources including geolocation
   * failures, weather API errors, and network connectivity issues.
   * Enables centralized error handling and user feedback.
   * 
   * @type {string|null}
   */
  const [error, setError] = useState(null);
  
  /**
   * Current weather data from OpenWeatherMap API
   * 
   * Contains comprehensive weather information including current conditions,
   * temperature, location details, and weather classifications. This data
   * drives both the UI theming system and music recommendation algorithms.
   * 
   * @type {Object|null}
   */
  const [weatherData, setWeatherData] = useState(null);
  
  /**
   * User playlist generation preferences
   * 
   * Configurable settings that control how playlists are generated including
   * track count, explicit content filtering, and other user preferences.
   * These settings are passed to the recommendation engine to customize output.
   * 
   * @type {Object}
   */
  const [playlistSettings, setPlaylistSettings] = useState({
    playlistLength: 10,    // Number of tracks to generate
    isExplicit: false      // Whether to include explicit content
  });

  // ============================================================================
  // DYNAMIC THEMING SYSTEM INTEGRATION
  // ============================================================================
  
  /**
   * Weather-based theme system
   * 
   * Utilizes a custom hook that analyzes current weather data and returns
   * appropriate theme configuration. This creates an immersive user experience
   * where the application's visual design reflects real-world conditions.
   * 
   * The theme system considers:
   * - Weather conditions (clear, rain, snow, clouds, etc.)
   * - Time of day (day/night variations)
   * - Seasonal factors
   * - Mood associations with weather patterns
   */
  const currentTheme = useWeatherTheme(weatherData);

  /**
   * Update user playlist settings
   * 
   * Callback function for the Settings component to update user preferences.
   * Maintains immutable state updates and triggers re-renders for dependent
   * components like the Playlists component.
   * 
   * @param {Object} newSettings - Updated settings object
   */
  const updateSettings = (newSettings) => {
    setPlaylistSettings(newSettings);
  };

  // ============================================================================
  // DYNAMIC THEME APPLICATION EFFECT
  // ============================================================================
  
  /**
   * Apply weather-based theme to application
   * 
   * This effect responds to theme changes by applying visual transitions
   * and logging theme information for development debugging. The smooth
   * transition creates a polished user experience when weather conditions
   * change or when users navigate between different weather locations.
   */
  useEffect(() => {
    if (currentTheme) {
      // Apply smooth visual transition for theme changes
      document.body.style.transition = 'all 1s ease-in-out';
      
      console.log(`🌤️ Weather theme changed to: ${currentTheme.name} (${currentTheme.mood} mood)`);
    }
  }, [currentTheme]);

  // ============================================================================
  // GEOLOCATION ACQUISITION SYSTEM
  // ============================================================================
  
  /**
   * Acquire user's geographic location using browser Geolocation API
   * 
   * This effect runs once on application mount to obtain the user's coordinates.
   * Implements comprehensive error handling for various failure scenarios
   * including permission denial, timeout, and unsupported browsers.
   * 
   * Configuration optimizes for accuracy while balancing performance:
   * - High accuracy GPS when available
   * - 10-second timeout to prevent hanging
   * - 10-minute cache to reduce repeated GPS queries
   */
  useEffect(() => {
    const getUserLocation = () => {
      // Validate browser support for geolocation
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        // Success callback - location acquired
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          console.log('Location obtained:', coords);
          setLocation(coords);
        },
        // Error callback - handle various failure scenarios
        (error) => {
          console.error('Error getting location:', error);
          setError('Failed to get your location. Please allow location access.');
          setLoading(false);
        },
        // Geolocation options for optimal performance and accuracy
        {
          enableHighAccuracy: true,  // Use GPS when available for best accuracy
          timeout: 10000,           // 10-second timeout to prevent hanging
          maximumAge: 600000        // Cache location for 10 minutes
        }
      );
    };

    getUserLocation();
  }, []); // Empty dependency array - run once on mount
  
  // ============================================================================
  // WEATHER DATA FETCHING SYSTEM
  // ============================================================================
  
  /**
   * Fetch weather data when user location becomes available
   * 
   * This effect responds to location changes by fetching current weather
   * conditions from the OpenWeatherMap API. Implements proper error handling
   * and loading state management for a smooth user experience.
   * 
   * The weather data obtained here drives:
   * - Dynamic theming and visual design
   * - Music recommendation algorithms
   * - User interface mood and presentation
   */
  useEffect(() => {
    const fetchWeatherData = async () => {
      // Wait for location to be available
      if (!location) return;

      try {
        setLoading(true);
        setError(null);
        
        // Fetch weather data using coordinates
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
  }, [location]); // Re-run when location changes

  // ============================================================================
  // DYNAMIC BACKGROUND STYLING SYSTEM
  // ============================================================================
  
  /**
   * Generate CSS class for weather-based background animations
   * 
   * Creates dynamic background effects that respond to current weather
   * conditions and time of day. This enhances the immersive experience
   * by making the application visually reflect real-world conditions.
   * 
   * Considers:
   * - Current weather condition (clear, rain, snow, clouds, etc.)
   * - Time of day for day/night variations
   * - Seasonal and atmospheric factors
   * 
   * @returns {string} CSS class name for weather-specific styling
   */
  const getWeatherClass = () => {
    // Validate weather data availability
    if (!weatherData || !weatherData.weather || !weatherData.weather[0]) return '';
    
    // Determine if it's currently day or night
    const currentHour = new Date().getHours();
    const isDay = currentHour >= 6 && currentHour < 18;
    const weatherMain = weatherData.weather[0].main.toLowerCase();
    
    // Special handling for clear weather with day/night variations
    if (weatherMain === 'clear') {
      return isDay ? 'weather-clear-day' : 'weather-clear-night';
    }
    
    // Standard weather condition classes
    return `weather-${weatherMain}`;
  };

  // ============================================================================
  // LOADING STATE INTERFACE
  // ============================================================================
  
  /**
   * Render loading interface during application initialization
   * 
   * Provides user feedback during the initial loading process including
   * geolocation acquisition and weather data fetching. Uses progressive
   * messaging to keep users informed about current operations.
   */
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading weather data...</p>
        <small>Getting your location and weather information...</small>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE INTERFACE
  // ============================================================================
  
  /**
   * Render error interface with recovery options
   * 
   * Displays user-friendly error messages with actionable recovery options.
   * Provides a retry mechanism that resets application state and attempts
   * to reload the entire initialization process.
   */
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

  // ============================================================================
  // WEATHER DATA PROCESSING STATE
  // ============================================================================
  
  /**
   * Render processing interface during weather data validation
   * 
   * Handles the brief period between successful data fetch and
   * application readiness. Provides feedback during data processing
   * and validation phases.
   */
  if (!weatherData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Processing weather data...</p>
        <small>Almost ready...</small>
      </div>
    );
  }

  // ============================================================================
  // MAIN APPLICATION INTERFACE
  // ============================================================================
  
  /**
   * Render the complete WeatherBeats application interface
   * 
   * Orchestrates all major components in a responsive layout:
   * 
   * 1. HEADER SECTION: Application branding and navigation
   * 2. WEATHER SECTION: Current conditions with dynamic theming
   * 3. PLAYLIST SECTION: Music generation and management
   * 4. SETTINGS SECTION: User preferences and customization
   * 
   * The layout uses CSS Grid/Flexbox for responsive design and
   * implements fade-in animations for smooth presentation.
   */
  return (
    <div className="app-container fade-in">
      {/* Development theme indicator for debugging */}
      {currentTheme && process.env.NODE_ENV === 'development' && (
        <div className="theme-indicator">
          <small>
            🎨 Current mood: <strong>{currentTheme.mood}</strong> 
            ({currentTheme.name} theme)
          </small>
        </div>
      )}

      {/* ================================================================ */}
      {/* HEADER SECTION - Application branding and user controls */}
      {/* ================================================================ */}
      <div className="header-section">
        <div className="header-title">
          <h1>WeatherBeats</h1>
        </div>
        <div className="header-actions">
          <Header />
        </div>
      </div>
      
      {/* ================================================================ */}
      {/* WEATHER SECTION - Dynamic weather display with theming */}
      {/* ================================================================ */}
      <div className={`weather-section ${getWeatherClass()}`}>
        <div className="weather-background"></div>
        <div className="weather-content">
          <Weather weatherData={weatherData} />
        </div>
      </div>
      
      {/* ================================================================ */}
      {/* BOTTOM SECTION - Main functionality (playlists + settings) */}
      {/* ================================================================ */}
      <div className="bottom-section">
        {/* Music generation and playlist management */}
        <div className="playlist-section">
          <Playlists 
            weatherData={weatherData}
            playlistSettings={playlistSettings}
          />
        </div>
        
        {/* User preferences and customization */}
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