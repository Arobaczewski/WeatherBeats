import { useState, useEffect } from "react";
import { Shuffle, Music, Loader, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { SpotifyAuth } from "../services/api";
import '../CSS/Playlists.css';

function Playlists({ weatherData, playlistSettings }){
    const [loading, setLoading] = useState(false);
    const [tracks, setTracks] = useState([]);
    const [error, setError] = useState(null);
    const [playlistCreated, setPlaylistCreated] = useState(false);
    const [spotifyAuth] = useState(new SpotifyAuth());
    const [creatingSpotifyPlaylist, setCreatingSpotifyPlaylist] = useState(false);
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [tracksPerPage] = useState(5);
    const [currentAudio, setCurrentAudio] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(30);
    const [volume, setVolume] = useState(0.5);

    const {
        name: cityName,
        weather: [{ main }]
    } = weatherData;

    const weatherMain = main;
    const playlistLength = playlistSettings.playlistLength || 30;
    const allowExplicit = playlistSettings.isExplicit === true;

    const totalPages = Math.ceil(tracks.length / tracksPerPage);
    const startIndex = (currentPage - 1) * tracksPerPage;
    const endIndex = startIndex + tracksPerPage;
    const currentTracks = tracks.slice(startIndex, endIndex);

    useEffect(() => {
        return () => {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.src = '';
            }
            setCurrentlyPlaying(null);
        };
    }, [currentAudio]);

    const handlePlay = async (track) => {
        if (!track.preview_url) {
            setError('No preview available for this track');
            return;
        }
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.src = '';
        }
        try {
            const audio = new Audio(track.preview_url);
            audio.volume = volume;

            audio.addEventListener('timeupdate', () => {
                setCurrentTime(audio.currentTime);
            });

            audio.addEventListener('loadedmetadata', () => {
                setDuration(audio.duration || 30);
            });

            audio.addEventListener('ended', () => {
                setCurrentlyPlaying(null);
                setCurrentTime(0);
            });

            await audio.play();
            setCurrentAudio(audio);
            setCurrentlyPlaying(track.id);
        } catch (error) {
            console.error('Failed to play audio:', error);
            alert('Failed to play preview');
        }
    };

    const handlePause = () => {
        if (currentAudio) {
            currentAudio.pause();
        }
        setCurrentlyPlaying(null);
    };

    const handleVolumeChange = (newVolume) => {
        setVolume(newVolume);
        if (currentAudio) {
            currentAudio.volume = newVolume;
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // ENHANCED: Smart playlist generation with multiple attempts
    const generatePlaylist = async () => {
        const authStatus = await spotifyAuth.debugAuthStatus();
        console.log('Auth status:', authStatus);

        if (!weatherData) {
            setError('Weather Data not available');
            return;
        }
        if (!spotifyAuth.isLoggedIn()) {
            setError('Please log into Spotify first');
            return;
        }
        
        setLoading(true);
        setError(null);
        setPlaylistCreated(false);
        setTracks([]);

        if (currentAudio) {
            currentAudio.pause();
            currentAudio.src = '';
        }
        setCurrentlyPlaying(null);

        try {
            console.log('Generating playlist for weather:', weatherMain, 'with', playlistLength, 'songs');
            
            let allTracks = [];
            let attempts = 0;
            const maxAttempts = 3;
            
            // SMART FETCHING: Request more tracks to account for filtering
            while (allTracks.length < playlistLength && attempts < maxAttempts) {
                attempts++;
                
                // Calculate how many more tracks we need
                const tracksNeeded = playlistLength - allTracks.length;
                
                // Request 50% more than needed to account for filtering
                const requestAmount = Math.min(50, Math.ceil(tracksNeeded * 1.5));
                
                console.log(`Attempt ${attempts}: Requesting ${requestAmount} tracks (need ${tracksNeeded} more)`);
                
                const recommendedTracks = await spotifyAuth.getRecommendations(
                    weatherMain, 
                    requestAmount,
                    allTracks.length > 0 ? allTracks[allTracks.length - 1].id : null // Use last track as seed for variety
                );

                if (!recommendedTracks || recommendedTracks.length === 0) {
                    if (attempts === 1) {
                        throw new Error('No tracks found for this weather condition');
                    }
                    break; // Try with what we have
                }

                // Filter out explicit content if needed
                let filteredTracks = recommendedTracks;
                if (!allowExplicit) {
                    filteredTracks = recommendedTracks.filter(track => !track.explicit);
                }

                // Remove duplicates by track ID
                const existingIds = new Set(allTracks.map(track => track.id));
                const newTracks = filteredTracks.filter(track => !existingIds.has(track.id));

                allTracks = [...allTracks, ...newTracks];
                
                console.log(`Got ${newTracks.length} new tracks, total: ${allTracks.length}/${playlistLength}`);
                
                // If we got very few new tracks, break to avoid infinite loop
                if (newTracks.length < 2 && attempts > 1) {
                    console.log('ot getting enough new tracks');
                    break;
                }
            }

            // Trim to exact requested length
            const finalTracks = allTracks.slice(0, playlistLength);

            if (finalTracks.length === 0) {
                if (!allowExplicit) {
                    setError('No non-explicit tracks found for this weather condition');
                } else {
                    setError('No tracks found for this weather condition');
                }
                return;
            }

            setTracks(finalTracks);
            setPlaylistCreated(true);
            
            // Show info about track availability
            const tracksWithPreviews = finalTracks.filter(track => track.preview_url).length;
            const tracksWithoutPreviews = finalTracks.length - tracksWithPreviews;
            
            console.log(`Successfully generated playlist with ${finalTracks.length} tracks`);
            console.log(`${tracksWithPreviews} tracks have previews, ${tracksWithoutPreviews} don't`);
            
            if (tracksWithoutPreviews > 0) {
                setError(`Generated ${finalTracks.length} tracks (${tracksWithoutPreviews} without preview)`);
            }

        } catch (error) {
            console.log('Error generating playlist:', error);

            if (error.message.includes('Authentication required') ||
                error.message.includes('token expired')) {
                setError('Please log into Spotify again');
            } else {
                setError(error.message || 'Failed to generate playlist');
            }
        } finally {
            setLoading(false);
        }
    };

    const goToPage = (pageNumber) => {
        // Stop audio when changing pages
        if (currentAudio) {
            currentAudio.pause();
        }
        setCurrentlyPlaying(null);
        setCurrentPage(pageNumber);
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const start = Math.max(1, currentPage - 2);
            const end = Math.min(totalPages, start + maxVisiblePages - 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }
        return pages;
    };

    const createSpotifyPlaylist = async () => {
        if (!tracks || tracks.length === 0) {
            setError('No tracks to add to playlist');
            return;
        }

        setCreatingSpotifyPlaylist(true);
        setError(null);

        try {
            const user = await spotifyAuth.getUserProfile();
            
            const playlist = await spotifyAuth.createPlaylist(
                user.id,
                `${cityName} - ${weatherMain} Vibes`,
                `Perfect playlist for ${weatherMain.toLowerCase()} weather in ${cityName}. Generated with ${tracks.length} tracks.`,
                false
            );

            const trackUris = tracks.map(track => track.uri);
            await spotifyAuth.addTracksToPlaylist(playlist.id, trackUris);

            alert(`Playlist created successfully! Check your Spotify app.`);
            
            if (playlist.external_urls?.spotify) {
                window.open(playlist.external_urls.spotify, '_blank');
            }

        } catch (error) {
            console.error('Error creating Spotify playlist:', error);
            setError('Failed to create Spotify playlist: ' + error.message);
        } finally {
            setCreatingSpotifyPlaylist(false);
        }
    };

    return (
        <div className="playlists-container">
            <div>
                <h2>Your Weather Playlist</h2>
            </div>
            
            {/* Generate button - only show when no playlist is created */}
            {!playlistCreated && (
                <div>
                    <p>
                        Ready to create your perfect playlist for today's weather in {cityName}?
                    </p>
                    <button 
                        className="playlists-btn" 
                        onClick={generatePlaylist}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader className="loading-spinner"/>
                                Generating...
                            </>
                        ) : (
                            'Generate playlist'
                        )}
                    </button>
                </div>
            )}

            {/* Only show playlist content when playlist is created */}
            {playlistCreated && tracks.length > 0 && (
                <div className="playlist-results">
                    <h3>Generated Playlist ({tracks.length} tracks)</h3>
                    
                    {/* Global Volume Control */}
                    <div className="global-controls">
                        <Volume2 size={16} />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                            style={{ width: '100px' }}
                        />
                        <span>{Math.round(volume * 100)}%</span>
                        {currentlyPlaying && (
                            <button onClick={handlePause} style={{ marginLeft: '10px' }}>
                                Stop All
                            </button>
                        )}
                    </div>

                    {/* Track List */}
                    <div className="track-list">
                        {currentTracks.map((track, index) => {
                            const isPlaying = currentlyPlaying === track.id;
                            const progressPercent = isPlaying && duration > 0 ? (currentTime / duration) * 100 : 0;
                            
                            return (
                                <div key={track.id} className="track-item">
                                    <div className="track-info-row">
                                        <span className="track-number">
                                            {startIndex + index + 1}.
                                        </span>
                                        
                                        {/* Album Art */}
                                        <img 
                                            src={track.album.images?.[2]?.url || track.album.images?.[0]?.url} 
                                            alt={`${track.album.name} cover`}
                                            width="40"
                                            height="40"
                                            style={{ borderRadius: '4px', marginRight: '10px' }}
                                            onError={(e) => {
                                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNSAxNUgyNVYyNUgyNVYxNVpNMTcgMjNWMThIMTlWMjBIMjJWMjJIMTlWMjNIMTdaIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo=';
                                            }}
                                        />
                                        
                                        <div className="track-details">
                                            <div className="track-name">{track.name}</div>
                                            <div className="track-artist">
                                                {track.artists.map(artist => artist.name).join(', ')}
                                            </div>
                                        </div>

                                        {/* Play/Pause Button */}
                                        <button
                                            onClick={isPlaying ? handlePause : () => handlePlay(track)}
                                            disabled={!track.preview_url}
                                            className="play-btn"
                                            title={!track.preview_url ? 'No preview available' : (isPlaying ? 'Pause' : 'Play preview')}
                                        >
                                            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                        </button>

                                        {/* Spotify Link */}
                                        <a 
                                            href={track.external_urls.spotify} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="spotify-link"
                                            title="Open in Spotify"
                                        >
                                            <Music size={16} />
                                        </a>
                                    </div>

                                    {/* Progress Bar (only show when playing) */}
                                    {isPlaying && track.preview_url && (
                                        <div className="progress-container">
                                            <div className="progress-bar">
                                                <div 
                                                    className="progress-fill"
                                                    style={{ 
                                                        width: `${progressPercent}%`,
                                                        height: '4px',
                                                        backgroundColor: '#1db954',
                                                        borderRadius: '2px',
                                                        transition: 'width 0.1s'
                                                    }}
                                                />
                                            </div>
                                            <div className="time-display">
                                                <span>{formatTime(currentTime)}</span>
                                                <span>Preview</span>
                                                <span>{formatTime(duration)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* No Preview Message */}
                                    {!track.preview_url && (
                                        <div className="no-preview">
                                            <VolumeX size={12}/>
                                            <span>No preview available</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="page-numbers">
                            {getPageNumbers().map(pageNum => (
                                <button
                                    key={pageNum}
                                    onClick={() => goToPage(pageNum)}
                                    className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                                >
                                    {pageNum}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="playlist-actions">
                        <button 
                            onClick={createSpotifyPlaylist}
                            disabled={creatingSpotifyPlaylist}
                        >
                            {creatingSpotifyPlaylist ? (
                                <>
                                    <Loader />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Music size={16} />
                                    Save to Spotify
                                </>
                            )}
                        </button>
                        
                        <button 
                            className="regen-playlist-btn" 
                            onClick={generatePlaylist}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader className="loading-spinner"/>
                                    Generating...
                                </>
                            ) : (
                                'Regenerate playlist'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div style={{ color: 'red', marginTop: '1rem' }}>
                    {error}
                </div>
            )}
        </div>
    );
}

export default Playlists