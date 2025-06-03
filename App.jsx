import Header from './Components/Header';
import Card from './Components/Card';
import Playlists from './Components/Playlists';
import Settings from './Components/Settings';
import Weather from './Components/WeatherCard';
import './CSS/App.css';
import { useState, useEffect } from 'react';
import { getWeather } from './services/api';


function App() {

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

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
  
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!location) return;

      try {
        setLoading(true);
        const weather = await getWeather(location.latitude, location.longitude);
        setWeatherData(weather);
        console.log('Weather data:', weather);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [location]);

  if (loading) {
    return <div>Loading weather data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <Header></Header>
      <Weather weatherData={weatherData}></Weather>
      <Card></Card>
      <Playlists></Playlists>
      <Settings></Settings>
    </>
  )
}

export default App
