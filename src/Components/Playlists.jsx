import { useState, useEffect } from "react";
import { Shuffle, Music, Loader, ExternalLink, Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { SpotifyAuth } from "../services/api";
import '../CSS/Playlists.css';

function Playlists({ weatherData, playlistSettings }){
    const [loading, setLoading] = useState(false);
    const [tracks, setTracks] = useState([]);
    const [error, setError] = useState(null);
    const [playlistCreated, setPlaylistCreated] = useState(false);
    const [spotifyAuth] = useState(new SpotifyAuth());
    const [creatingSpotifyPlaylist, setCreatingSpotifyPlaylist] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [tracksPerPage] = useState(6);

    const {
        name: cityName,
        weather: [{ main }]
    } = weatherData || { name: 'Unknown', weather: [{ main: 'Clear' }] };

    const weatherMain = main;
    const playlistLength = playlistSettings?.playlistLength || 10;
    const allowExplicit = playlistSettings?.isExplicit === true;

    const totalPages = Math.ceil(tracks.length / tracksPerPage);
    const startIndex = (currentPage - 1) * tracksPerPage;
    const endIndex = startIndex + tracksPerPage;
    const currentTracks = tracks.slice(startIndex, endIndex);

    // Generate playlist using updated API
    const generatePlaylist = async () => {
        console.log('🚀 Generate playlist button clicked!');
        
        try {
            console.log('📊 Checking prerequisites...');
            
            if (!weatherData) {
                console.error('❌ No weather data available');
                setError('Weather data not available - please refresh the page');
                return;
            }

            // Check environment variables
            console.log('🔧 Checking environment variables...');
            const spotifyKey = import.meta.env.VITE_SPOTIFY_API_KEY;
            console.log('Spotify API key exists:', !!spotifyKey);

            if (!spotifyKey) {
                console.error('❌ Spotify API key missing');
                setError('Spotify API key not configured - please contact support');
                return;
            }

            console.log('⏳ Setting loading state...');
            setLoading(true);
            setError(null);
            setPlaylistCreated(false);
            setTracks([]);

            console.log('🎵 Calling getRecommendations with explicit setting...');
            console.log('Parameters:', { weatherMain, playlistLength, allowExplicit });
            
            // This now includes the allowExplicit parameter
            const recommendedTracks = await spotifyAuth.getRecommendations(weatherMain, playlistLength, allowExplicit);
            
            console.log('✅ Recommendations received:', recommendedTracks);
            console.log('Number of tracks:', recommendedTracks?.length || 0);

            if (!recommendedTracks || recommendedTracks.length === 0) {
                console.error('❌ No tracks in recommendations');
                throw new Error('Unable to generate playlist. This may be due to Spotify API restrictions or regional limitations. Please try again.');
            }

            // The filtering is now handled in the API method itself
            console.log('✅ Setting final tracks...');
            setTracks(recommendedTracks);
            setPlaylistCreated(true);
            
            console.log(`🎉 SUCCESS: Generated ${recommendedTracks.length} tracks`);

        } catch (error) {
            console.error('💥 Playlist generation error:', error);

            if (error.message.includes('Client ID not configured')) {
                setError('Spotify API not configured properly - please contact support');
            } else if (error.message.includes('rate limit') || error.message.includes('429')) {
                setError('⚠️ Rate limited by Spotify - please wait 30 seconds and try again');
            } else if (error.message.includes('401') || error.message.includes('403')) {
                setError('⚠️ Spotify access denied - this may be due to regional restrictions or API limitations');
            } else if (error.message.includes('regional limitations')) {
                setError('⚠️ Regional limitations detected. Trying different markets may help - please try regenerating.');
            } else if (error.message.includes('No tracks available after filtering')) {
                setError('⚠️ No clean tracks found for this weather. Try enabling explicit content in settings.');
            } else {
                setError(error.message || 'Failed to generate playlist. Please try again.');
            }
        } finally {
            console.log('🔄 Clearing loading state...');
            setLoading(false);
        }
    };

    const goToPage = (pageNumber) => {
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
        console.log('🎵 Create Spotify playlist clicked');
        
        // Check if user is logged in for playlist creation
        if (!spotifyAuth.isLoggedIn()) {
            setError('To save playlists to Spotify, please log in with your Spotify account first');
            return;
        }
        
        if (!tracks || tracks.length === 0) {
            setError('No tracks to add to playlist');
            return;
        }

        setCreatingSpotifyPlaylist(true);
        setError(null);

        try {
            console.log('👤 Getting user profile...');
            const user = await spotifyAuth.getUserProfile();
            console.log('User profile:', user);
            
            console.log('📝 Creating playlist...');
            const playlist = await spotifyAuth.createPlaylist(
                user.id,
                `${cityName} - ${weatherMain} Vibes`,
                `Perfect playlist for ${weatherMain.toLowerCase()} weather in ${cityName}. Generated with ${tracks.length} tracks using WeatherBeats.`,
                false
            );
            
            console.log('Playlist created:', playlist);

            console.log('➕ Adding tracks to playlist...');
            const trackUris = tracks.map(track => track.uri);
            
            await spotifyAuth.addTracksToPlaylist(playlist.id, trackUris);

            alert(`Playlist "${playlist.name}" created successfully! Check your Spotify app.`);
            
            if (playlist.external_urls?.spotify) {
                window.open(playlist.external_urls.spotify, '_blank');
            }

        } catch (error) {
            console.error('💥 Error creating Spotify playlist:', error);
            
            if (error.message.includes('Authentication required')) {
                setError('Please log into Spotify to save playlists to your account');
            } else {
                setError('Failed to create Spotify playlist: ' + error.message);
            }
        } finally {
            setCreatingSpotifyPlaylist(false);
        }
    };

    const formatDuration = (durationMs) => {
        const minutes = Math.floor(durationMs / 60000);
        const seconds = ((durationMs % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds.padStart(2, '0')}`;
    };

    return (
        <div className="playlists-container">
            <div>
                <h2>Your Weather Playlist</h2>
            </div>
            
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
                            <>
                                <Music size={16} />
                                Generate playlist
                            </>
                        )}
                    </button>
                    
                    <div className="generation-info">
                        <Info size={14} />
                        <small>
                            {allowExplicit ? 'Including all content' : 'Clean content only'} • 
                            Requesting {playlistLength} tracks • 
                            Songs will open in Spotify for full playback.
                        </small>
                    </div>
                </div>
            )}

            {playlistCreated && tracks.length > 0 && (
                <div className="playlist-results">
                    <h3>Generated Playlist ({tracks.length} tracks)</h3>
                    
                    {/* Track List */}
                    <div className="track-list">
                        {currentTracks.map((track, index) => {
                            return (
                                <div key={track.id} className="track-item">
                                    <div className="track-info-row">
                                        <span className="track-number">
                                            {startIndex + index + 1}.
                                        </span>
                                        
                                        <img 
                                            src={track.album.images?.[2]?.url || track.album.images?.[0]?.url} 
                                            alt={`${track.album.name} cover`}
                                            width="50"
                                            height="50"
                                            className="album-art"
                                            onError={(e) => {
                                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEgzMFYzMEgzMFYyMFpNMjIgMjhWMjNIMjRWMjVIMjdWMjdIMjRWMjhIMjJaIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo=';
                                            }}
                                        />
                                        
                                        <div className="track-details">
                                            <div className="track-name">
                                                {track.name}
                                                {track.explicit && <span className="explicit-badge">E</span>}
                                            </div>
                                            <div className="track-artist">
                                                {track.artists.map(artist => artist.name).join(', ')}
                                            </div>
                                            <div className="track-album">
                                                {track.album.name}
                                            </div>
                                        </div>

                                        <div className="track-meta">
                                            <span className="track-duration">
                                                {formatDuration(track.duration_ms)}
                                            </span>
                                        </div>

                                        <a 
                                            href={track.external_urls.spotify} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="spotify-link"
                                            title="Open in Spotify"
                                        >
                                            <ExternalLink size={20} />
                                        </a>
                                    </div>
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
                            className="save-to-spotify-btn"
                        >
                            {creatingSpotifyPlaylist ? (
                                <>
                                    <Loader className="loading-spinner" />
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
                                <>
                                    <RefreshCw size={16} />
                                    Regenerate playlist
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className={`error-message ${error.includes('✅') ? 'success-info' : 'error-info'}`}>
                    {error}
                </div>
            )}
        </div>
    );
}

export default Playlists;