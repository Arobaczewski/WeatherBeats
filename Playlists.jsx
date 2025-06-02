import { useState } from "react";
import { Shuffle } from 'lucide-react';

function Playlists(){
    const [playlist, setPlaylist] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const moodProfiles = {
        'clear': {
            energy: 0.3,        // Low energy
            valence: 0.4,       // Slightly melancholic
            danceability: 0.4,  // Less danceable
            acousticness: 0.7,  // More acoustic
            tempo: 80,          // Slower tempo
            genres: ['indie', 'folk', 'acoustic', 'chill']
        },

        'rain': {
            energy: 0.3,        // Low energy
            valence: 0.4,       // Slightly melancholic
            danceability: 0.4,  // Less danceable
            acousticness: 0.7,  // More acoustic
            tempo: 80,          // Slower tempo
            genres: ['indie', 'folk', 'acoustic', 'chill']
        },

        'clouds': {
            energy: 0.5,        // Medium energy
            valence: 0.5,       // Neutral mood
            danceability: 0.5,  // Moderate
            acousticness: 0.5,  // Balanced
            tempo: 100,         // Medium tempo
            genres: ['indie-pop', 'alternative', 'rock']
        },
         'thunderstorm': {
            energy: 0.8,        // High intensity
            valence: 0.3,       // Darker mood
            danceability: 0.4,  // Less danceable
            acousticness: 0.2,  // Electronic/rock
            tempo: 130,         // Fast but intense
            genres: ['rock', 'metal', 'electronic']
        },
        'snow': {
            energy: 0.2,        // Very low energy
            valence: 0.6,       // Peaceful/cozy
            danceability: 0.3,  // Minimal dancing
            acousticness: 0.8,  // Very acoustic
            tempo: 70,          // Slow and peaceful
            genres: ['ambient', 'classical', 'folk']
        }
    };



    const generatePlaylist = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setPlaylist()
            setIsGenerating(false);
        }, 2000);
    };


    return (
        <div className="playlists-container">
            <div>
                <h2>Your Weather Playlist</h2>
                <button></button>
                <Shuffle />
            </div>
            <div>
                <p>
                    Ready to create your perfect playlist for today's weather?
                </p>
                <button className="playlists-btn" onClick={generatePlaylist}>Generate Playlist</button>
            </div>
        </div>
    )
}

export default Playlists