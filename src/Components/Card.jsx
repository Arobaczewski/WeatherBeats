/**
 * Card Component - Weather-Based Music Mood Display
 * 
 * This component translates weather conditions into musical recommendations and mood descriptions.
 * It serves as the conceptual bridge between meteorological data and musical preferences,
 * providing users with curated genre suggestions based on atmospheric conditions.
 * 
 * Key Features:
 * - Weather-to-music mapping algorithm
 * - Day/night awareness for nuanced recommendations
 * - Comprehensive weather condition coverage (12+ weather types)
 * - Visual genre tags with hover animations
 * - Poetic descriptions that connect weather to musical moods
 * 
 * Design Philosophy:
 * The component operates on the principle that weather affects human emotion and energy,
 * which in turn influences musical preferences. Each weather condition is mapped to
 * specific genres and moods that complement the atmospheric experience.
 * 
 */

import { useState, useEffect } from "react";
import '../CSS/Card.css';

function Card({ weatherData }){
    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================
    
    /**
     * Poetic description of how current weather affects musical mood
     * Updated based on weather conditions to provide contextual narrative
     */
    const [description, setDescription] = useState('');
    
    /**
     * Array of music genres/styles that complement current weather
     * Dynamically populated based on weather-to-music mapping algorithm
     */
    const [musicStyles, setMusicStyles] = useState([]);

    /**
     * Extract main weather condition from weather data
     * This is the primary driver for all mood and genre recommendations
     */
    const {
    weather: [{main}]
        } = weatherData;

    const weatherMain = main;
    
    // ========================================================================
    // WEATHER-TO-MUSIC MAPPING ALGORITHM
    // ========================================================================
    
    /**
     * Core effect that maps weather conditions to musical moods and genres
     * 
     * This algorithm considers:
     * - Primary weather condition (rain, snow, clear, etc.)
     * - Time of day (affects energy levels and mood)
     * - Atmospheric qualities (intensity, visibility, temperature implications)
     * 
     * The mapping is based on psychological research about weather's impact on mood
     * and empirical observations about music listening patterns during different conditions.
     */
    useEffect(() => {
        // ====================================================================
        // WEATHER MOOD DESCRIPTIONS
        // ====================================================================
        
        /**
         * Curated descriptions that connect weather phenomena to musical experiences
         * Each description aims to evoke the emotional and atmospheric qualities
         * that make certain music genres particularly fitting for specific weather
         */
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

        // ====================================================================
        // GENRE MAPPING MATRIX
        // ====================================================================
        
        /**
         * Comprehensive mapping of weather conditions to music genres
         * 
         * Each weather type is associated with 4 primary genres that:
         * 1. Match the energy level of the weather
         * 2. Complement the emotional tone
         * 3. Enhance the atmospheric experience
         * 4. Provide variety within the mood spectrum
         * 
         * Genres are ordered roughly by relevance/popularity for each condition
         */
        const weatherMusicStyles = {
            // Contemplative, cozy indoor music
            rain: ["Lo-fi Hip Hop", "Ambient", "Indie Folk", "Jazz"],
            
            // Lighter, more optimistic than heavy rain
            drizzle: ["Chill Pop", "Acoustic", "Soft Rock", "Neo-Soul"],
            
            // High-energy music matching storm intensity
            thunderstorm: ["Heavy Metal", "Rock", "Electronic", "Drum & Bass"],
            
            // Peaceful, wintery, introspective music
            snow: ["Classical", "Ambient", "Folk", "Winter Jazz"],
            
            // Balanced, neither too upbeat nor melancholic
            clouds: ["Alternative", "Indie Pop", "Soft Electronic", "Contemporary"],
            
            // Ethereal, floating, mysterious sounds
            mist: ["Ambient", "Downtempo", "Ethereal", "Dream Pop"],
            
            // Gritty, urban, cutting-edge alternative music
            smoke: ["Alternative Rock", "Grunge", "Industrial", "Dark Electronic"],
            
            // Psychedelic, reality-bending atmospheric music
            haze: ["Psychedelic", "Shoegaze", "Ambient Rock", "Trip Hop"],
            
            // Wide open spaces, Americana, desert vibes
            dust: ["Desert Rock", "Alternative Country", "Americana", "Folk Rock"],
            
            // Minimalist, emerging from silence
            fog: ["Atmospheric", "Post-Rock", "Ambient", "Minimalist"],
            
            // Dark, apocalyptic, industrial atmosphere
            ash: ["Post-Apocalyptic", "Dark Ambient", "Industrial", "Drone"],
            
            // Most intense, chaotic music for extreme weather
            tornado: ["Extreme Metal", "Hardcore", "Breakcore", "Noise"],
            
            // Bright, energetic daytime music
            clearDay: ["Pop", "Reggae", "Upbeat Folk", "Happy Hip Hop"],
            
            // Smooth, romantic nighttime vibes
            clearNight: ["R&B", "Smooth Jazz", "Chillwave", "Lounge"]
    };

        // ====================================================================
        // DAY/NIGHT DETECTION
        // ====================================================================
        
        /**
         * Determine if it's currently day or night
         * This affects music recommendations for "clear" weather conditions
         * 
         * Day: 6 AM to 6 PM (more energetic, outdoor-oriented music)
         * Night: 6 PM to 6 AM (more relaxed, intimate music)
         */
        const currentHour = new Date().getHours();
        const isDay = currentHour >= 6 && currentHour < 18;

        // ====================================================================
        // WEATHER CONDITION PROCESSING
        // ====================================================================
        
        /**
         * Switch statement that maps weather conditions to descriptions and genres
         * 
         * Each case:
         * 1. Sets appropriate mood description
         * 2. Assigns corresponding music genres
         * 3. Handles special cases (day/night for clear weather)
         * 
         * The switch covers all major weather conditions that the OpenWeatherMap API
         * can return, ensuring robust handling of any weather scenario.
         */
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
            /**
             * Special handling for clear weather conditions
             * Different recommendations based on time of day:
             * - Day: Energetic, outdoor-friendly music
             * - Night: Romantic, relaxed evening vibes
             */
            if(isDay){
                setDescription(sunnyDescription);
                setMusicStyles(weatherMusicStyles.clearDay);
                    } else {
                        setDescription(moonDescription);
                        setMusicStyles(weatherMusicStyles.clearNight);
                    } 
                        break;
            default: 
                /**
                 * Fallback for unknown weather conditions
                 * Defaults to clear weather logic with day/night handling
                 */
                if(isDay){
                    setDescription(sunnyDescription);
                    setMusicStyles(weatherMusicStyles.clearDay);
                } else {
                    setDescription(moonDescription);
                    setMusicStyles(weatherMusicStyles.clearNight);
                } 

        }

    }, [weatherMain]); // Re-run when weather condition changes
    
    /**
     * Render the music mood card with:
     * 1. Header indicating this is today's musical recommendation
     * 2. Poetic description connecting weather to musical mood
     * 3. Visual genre tags that users can see at a glance
     * 
     * Each genre tag is individually rendered for styling flexibility
     * and potential future interactivity (clicking to filter playlists, etc.)
     */
    return (
        <div className="card-container">
            <h2 className="card-header">Today's Musical Mood</h2>
            <p>{description}</p>
        <div>
            {/* Render each music style as a visual tag */}
            {musicStyles.map((style, index) => (
            <span key={index} className="music-style-tag">{style}</span>
        ))}
        </div>
        </div>
    )
}

export default Card;