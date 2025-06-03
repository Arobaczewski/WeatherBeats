import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, MoonStar, CloudFog, Haze, Wind, Tornado, CloudDrizzle, CloudLightning, Snowflake } from 'lucide-react';
function WeatherCard ({ weatherData }){
    const [currentTime, setCurrentTime] = useState('');
    const [icon, setIcon] = useState(null);

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


    if(!weatherData) {
        return (
            <div>
                <p>Loading weather data...</p>
            </div>
        );
    }
    const weatherIcons = {
        rain: {
            lightRain: 'light rain',
            moderateRain: 'moderate rain',
            heavyIntensityRain: 'heavy intensity rain',
            veryHeavyRain: 'very heavy rain',
            extremeRain: 'extreme rain',
            freezingRain: 'freezing rain',
            lightIntensityShowerRain: 'light intensity shower rain',
            showerRain: 'shower rain',
            heavyIntensityShowerRain: 'heavy intensity shower rain',
            raggedShowerRain: 'ragged shower rain'
        },
        drizzle: {
            lightIntensityDrizzle: 'light intensity drizzle',
            drizzling: 'dizzle',
            heavyIntensityDrizzle: 'heavy intensity drizzle',
            lightIntensityDrizzleRain: 'light intensity drizzle rain',
            drizzleRain: 'drizzle rain',
            heavyIntensityDrizzleRain: 'heavy intensity drizzle rain',
            showerRainAndDrizzle: 'shower rain and drizzle',
            heavyShowerRainAndDrizzle: 'heavy shower rain and drizzle',
            showerDrizzle: 'shower drizzle'
        },
        thunderstorm: {
            thunderstormWithLightRain: 'thunderstorm with light rain',
            thunderstormWithRain: 'thunderstorm with rain',
            thunderstormWithHeavyRain: 'thunderstorm with heavy rain',
            lightThunderstorm: 'light thunderstorm',
            thunderstorming: 'thunderstorm',
            heavyThunderstorm: 'heavy thunderstorm',
            raggedThunderstorm: 'ragged thunderstorm',
            thunderstormWithLightDrizzle: 'thunderstorm with light drizzle',
            thunderstormWithDrizzle: 'thunderstorm with drizzle',
            thunderstormWithHeavyDrizzle: 'thunderstorm with heavy drizzle'
        },
        snow: {
            lightSnow: 'light snow',
            snowing: 'snow',
            heavySnow: 'heavy snow',
            sleet: 'sleet',
            lightShowerSleet: 'light shower sleet',
            showerSleet: 'shower sleet',
            lightRainAndSnow: 'light rain and snow',
            rainAndSnow: 'rain and snow',
            lightShowerSnow: 'light shower snow',
            showerSnow: 'shower snow',
            heavyShowerSnow: 'heavy shower snow'
        },
        clouds: {
            fewClouds: 'few clouds',
            scatteredClouds: 'scattered clouds',
            brokenClouds: 'broken clouds',
            overcastClouds: 'overcast clouds'
        },
        moon: 'clear sky',
        sun: 'clear sky',
        mist: 'mist',
        smoke: 'smoke',
        haze: 'haze',
        dust: {
            sandDustWhirls: 'sand/dust whirls',
            dusty: 'dust'
        },
        fog: 'fog',
        ash: 'volcanic ash',
        tornado: 'tornado'
    };

    useEffect(() => {
    const isDay = currentTime <= 12;

    const updateIcon = () => {
        switch (weatherDescription) {
            case weatherIcons.rain:
                setIcon(<CloudRain/>);
                break;
            case weatherIcons.drizzle:
                setIcon(<CloudDrizzle/>);
                break;
            case weatherIcons.thunderstorm:
                setIcon(<CloudLightning/>);
                break;
            case weatherIcons.snow:
                setIcon(<Snowflake/>);
                break;
            case weatherIcons.clouds:
                setIcon(<Cloud/>);
                break;
            case weatherIcons.mist:
                setIcon(<CloudFog/>);
                break;
            case weatherIcons.smoke:
                setIcon(<CloudFog/>);
                break;
            case weatherIcons.haze:
                setIcon(<Haze/>);
                break;
            case weatherIcons.dust:
                setIcon(<Haze/>);
                break;
            case weatherIcons.fog:
                setIcon(<CloudFog/>);
                break;
            case weatherIcons.ash:
                setIcon(<Haze/>);
                break;
            case weatherIcons.tornado:
                setIcon(<Tornado/>);
                break;
            default: 
                if(isDay){
                    return setIcon(<Sun/>);
                } else {
                    return setIcon(<MoonStar/>);
                } 
            };
    };
    updateIcon();
 }, [weatherDescription]);


    return (
        <div>
            <div>
                <span>{city}</span>
            </div>
            <div>
                <span>Temp: {temperature}</span>
                <span>Feels like: {feelsLike}</span>
                <span>{description}</span>
            </div>
            <div>
                <span>{currentTime}</span>
                <span>{icon}</span>
            </div>
        </div>
    )
}

export default WeatherCard