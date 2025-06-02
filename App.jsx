import Header from './Components/Header';
import Card from './Components/Card';
import Playlists from './Components/Playlists';
import Settings from './Components/Settings';
import Weather from './Components/WeatherCard';
import './CSS/App.css';
import { getWeather, latitude, longitude } from './services/api';

const success = (pos) => {
  const coords = pos.coords;
  console.log(coords)
}

const error = (err) => {
    console.error(err)
}

export const getLocation = navigator.geolocation.getCurrentPosition(
    success,
    error
);


function App() {

  latitude();
  longitude();


  return (
    <>
      <Header></Header>
      <Weather></Weather>
      <Card></Card>
      <Playlists></Playlists>
      <Settings></Settings>
    </>
  )
}

export default App
