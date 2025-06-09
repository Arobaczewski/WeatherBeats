import { useState, useEffect } from "react";
import '../CSS/Card.css';

function Card({ weatherData }){
    const [description, setDescription] = useState('');
    const [musicStyles, setMusicStyles] = useState([]);

    const {
    weather: [{main}]
        } = weatherData;

    const weatherMain = main;
    
    useEffect(() => {
        const rainDescription = "Rainy weather sets a contemplative, cozy mood. Perfect for introspection, reading, or relaxing indoors.";
        const thunderstormDescription = "Thunderstorms demand powerful, intense music that matches nature's dramatic energy and raw power.";
        const tornadoDescription = "Tornado conditions demand the most intense, chaotic music to match nature's ultimate power.";
        const snowDescription = "Snow creates a peaceful, magical winter wonderland atmosphere. Music for cozy moments and quiet reflection.";
        const cloudyDescription = "Overcast skies bring a balanced, contemplative mood. Neither too upbeat nor too melancholic - perfect for steady focus.";
        const mistDescription = "Misty conditions create an ethereal, mysterious atmosphere. Perfect for dreamy, ambient music that floats like fog.";
        const smokeDescription = "Smoky air brings a gritty, urban edge. Time for alternative and indie rock that cuts through the haze.";
        const hazeDescription = "Hazy skies blur the lines between reality and dreams. Ideal for psychedelic and atmospheric soundscapes.";
        const dustDescription = "Dusty conditions evoke wide open spaces and rugged landscapes. Perfect for Americana and desert rock vibes.";
        const fogDescription = "Dense fog creates an intimate, enclosed world. Perfect for minimalist and post-rock that emerges from silence.";
        const ashDescription = "Ash in the air brings an apocalyptic, otherworldly feel. Time for dark ambient and industrial sounds.";
        const sunnyDescription = "Clear skies call for bright, uplifting music that matches the sunshine. Perfect for outdoor activities and positive vibes.";
        const moonDescription = "Clear skies call for bright, uplifting music that matches the moonlight. Perfect for outdoor activities and positive vibes.";

        const weatherMusicStyles = {
            rain: ["Lo-fi Hip Hop", "Ambient", "Indie Folk", "Jazz"],
            drizzle: ["Chill Pop", "Acoustic", "Soft Rock", "Neo-Soul"],
            thunderstorm: ["Heavy Metal", "Rock", "Electronic", "Drum & Bass"],
            snow: ["Classical", "Ambient", "Folk", "Winter Jazz"],
            clouds: ["Alternative", "Indie Pop", "Soft Electronic", "Contemporary"],
            mist: ["Ambient", "Downtempo", "Ethereal", "Dream Pop"],
            smoke: ["Alternative Rock", "Grunge", "Industrial", "Dark Electronic"],
            haze: ["Psychedelic", "Shoegaze", "Ambient Rock", "Trip Hop"],
            dust: ["Desert Rock", "Alternative Country", "Americana", "Folk Rock"],
            fog: ["Atmospheric", "Post-Rock", "Ambient", "Minimalist"],
            ash: ["Post-Apocalyptic", "Dark Ambient", "Industrial", "Drone"],
            tornado: ["Extreme Metal", "Hardcore", "Breakcore", "Noise"],
            clearDay: ["Pop", "Reggae", "Upbeat Folk", "Happy Hip Hop"],
            clearNight: ["R&B", "Smooth Jazz", "Chillwave", "Lounge"]
    };

        const currentHour = new Date().getHours();
        const isDay = currentHour >= 6 && currentHour < 18;

        switch (weatherMain.toLowerCase()) {
            case 'rain':
                setDescription(rainDescription);
                setMusicStyles(weatherMusicStyles.rain);
                break;
            case 'drizzle':
                setDescription(rainDescription);
                setMusicStyles(weatherMusicStyles.drizzle);
                break;
            case 'thunderstorm':
                setDescription(thunderstormDescription);
                setMusicStyles(weatherMusicStyles.thunderstorm);
                break;
            case 'snow':
                setDescription(snowDescription);
                setMusicStyles(weatherMusicStyles.snow);
                break;
            case 'clouds':
                setDescription(cloudyDescription);
                setMusicStyles(weatherMusicStyles.clouds);
                break;
            case 'mist':
                setDescription(mistDescription);
                setMusicStyles(weatherMusicStyles.mist);
                break;
            case 'smoke':
                setDescription(smokeDescription);
                setMusicStyles(weatherMusicStyles.smoke);
                break;
            case 'haze':
                setDescription(hazeDescription);
                setMusicStyles(weatherMusicStyles.haze);
                break;
            case 'dust':
                setDescription(dustDescription);
                setMusicStyles(weatherMusicStyles.dust);
                break;
            case 'fog':
                setDescription(fogDescription);
                setMusicStyles(weatherMusicStyles.fog);
                break;
            case 'ash':
                setDescription(ashDescription);
                setMusicStyles(weatherMusicStyles.ash);
                break;
            case 'tornado':
                setDescription(tornadoDescription);
                setMusicStyles(weatherMusicStyles.tornado);
                break;
            case 'clear':
            if(isDay){
                setDescription(sunnyDescription);
                setMusicStyles(weatherMusicStyles.clearDay);
                    } else {
                        setDescription(moonDescription);
                        setMusicStyles(weatherMusicStyles.clearNight);
                    } 
                        break;
            default: 
                if(isDay){
                    setDescription(sunnyDescription);
                    setMusicStyles(weatherMusicStyles.clearDay);
                } else {
                    setDescription(moonDescription);
                    setMusicStyles(weatherMusicStyles.clearNight);
                } 

        }

    }, [weatherMain]);
    
    
    return (
        <div className="card-container">
            <h2 className="card-header">Today's Musical Mood</h2>
            <p>{description}</p>
        <div>
            {musicStyles.map((style, index) => (
            <span key={index} className="music-style-tag">{style}</span>
        ))}
        </div>
        </div>
    )
}

export default Card;