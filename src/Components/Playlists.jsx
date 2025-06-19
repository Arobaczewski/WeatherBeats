/**
 * Playlists Component - Intelligent Weather-Based Music Generation
 * 
 * This component orchestrates the core music discovery experience by generating
 * personalized playlists based on current weather conditions. It leverages a
 * sophisticated search-based recommendation system that analyzes weather data
 * and creates curated music collections.
 * 
 * Key Features:
 * - Intelligent weather-to-music mapping algorithm
 * - Search-based music discovery using multiple query strategies
 * - Regional content optimization for global accessibility
 * - Paginated track display with rich metadata
 * - Direct Spotify integration for playlist creation and playback
 * - User preference handling (explicit content filtering, playlist length)
 * - Comprehensive error handling and user feedback
 * 
 * Technical Implementation:
 * - Uses sophisticated search algorithms instead of basic recommendation APIs
 * - Implements quality filtering and artist variety optimization
 * - Handles regional market restrictions and content availability
 * - Provides transparent feedback about generation process
 * - Manages rate limiting and API restrictions gracefully
 * 
 * Architecture:
 * The component works closely with the SpotifyAuth service to execute
 * complex search strategies that map weather conditions to appropriate
 * musical characteristics including genres, moods, and energy levels.
 * 
 */

import { useState, useEffect } from "react";
import { Shuffle, Music, Loader, ExternalLink, Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { SpotifyAuth } from "../services/api";
import '../CSS/Playlists.css';

function Playlists({ weatherData, playlistSettings }){
    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================
    
    /**
     * Loading state for playlist generation process
     * Controls UI feedback during the sophisticated search and curation process
     * which can take several seconds due to multiple API calls and filtering
     */
    const [loading, setLoading] = useState(false);
    
    /**
     * Array of curated track objects from Spotify's catalog
     * Each track contains comprehensive metadata: name, artist, album, duration,
     * explicit content flags, popularity scores, and availability information
     */
    const [tracks, setTracks] = useState([]);
    
    /**
     * Error state for comprehensive user feedback
     * Handles various failure scenarios including API rate limits, regional
     * restrictions, authentication issues, and content availability problems
     */
    const [error, setError] = useState(null);
    
    /**
     * Success flag indicating playlist generation completion
     * Controls UI state transitions and determines available user actions
     */
    const [playlistCreated, setPlaylistCreated] = useState(false);
    
    /**
     * Spotify API service instance with sophisticated recommendation algorithms
     * Handles OAuth authentication, search-based music discovery, regional
     * optimization, and playlist management operations
     */
    const [spotifyAuth] = useState(new SpotifyAuth());
    
    /**
     * Loading state for Spotify playlist creation operations
     * Separate from generation loading to allow concurrent operations
     * (user can regenerate while saving a previous playlist)
     */
    const [creatingSpotifyPlaylist, setCreatingSpotifyPlaylist] = useState(false);
    
    /**
     * Current page number for track pagination
     * Manages display of large playlists in digestible chunks
     */
    const [currentPage, setCurrentPage] = useState(1);
    
    /**
     * Number of tracks displayed per page
     * Optimized for readability and performance on various screen sizes
     */
    const [tracksPerPage] = useState(6);

    // ========================================================================
    // DATA EXTRACTION AND COMPUTATION
    // ========================================================================
    
    /**
     * Extract and validate weather and location data from props
     * Provides defensive programming with fallback values to prevent
     * application crashes when weather data is temporarily unavailable
     */
    const {
        name: cityName,
        weather: [{ main }]
    } = weatherData || { name: 'Unknown', weather: [{ main: 'Clear' }] };

    /**
     * Extract user preferences that control the recommendation algorithm
     * These settings directly influence the search strategies, content filtering,
     * and final playlist composition in the underlying API service
     */
    const weatherMain = main;
    const playlistLength = playlistSettings?.playlistLength || 10;
    const allowExplicit = playlistSettings?.isExplicit === true;

    /**
     * Calculate pagination variables for track display management
     * Enables smooth navigation through large playlists without overwhelming UI
     */
    const totalPages = Math.ceil(tracks.length / tracksPerPage);
    const startIndex = (currentPage - 1) * tracksPerPage;
    const endIndex = startIndex + tracksPerPage;
    const currentTracks = tracks.slice(startIndex, endIndex);

    // ========================================================================
    // CORE PLAYLIST GENERATION ENGINE
    // ========================================================================
    
    /**
     * Execute sophisticated weather-based playlist generation
     * 
     * This function orchestrates the entire music discovery process:
     * 
     * 1. VALIDATION PHASE:
     *    - Validates weather data availability
     *    - Confirms API credentials and service connectivity
     * 
     * 2. GENERATION PHASE:
     *    - Maps weather conditions to musical characteristics
     *    - Executes multi-strategy search across global markets
     *    - Applies quality filters and variety optimization
     *    - Handles user content preferences (explicit filtering)
     * 
     * 3. POST-PROCESSING PHASE:
     *    - Removes duplicates and ensures artist variety
     *    - Applies final user preferences and shuffling
     *    - Updates UI state with curated results
     * 
     * The underlying algorithm uses sophisticated search strategies including:
     * - Genre-based targeting with temporal filtering
     * - Mood and energy level matching
     * - Artist and popularity-based discovery
     * - Regional market optimization for content availability
     * - Weather-specific keyword and semantic searching
     */
    const generatePlaylist = async () => {
        console.log('🚀 Generate playlist button clicked!');
        
        try {
            console.log('📊 Checking prerequisites...');
            
            // Phase 1: Validate essential data availability
            if (!weatherData) {
                console.error('❌ No weather data available');
                setError('Weather data not available - please refresh the page');
                return;
            }

            // Phase 2: Verify API service configuration
            console.log('🔧 Checking environment variables...');
            const spotifyKey = import.meta.env.VITE_SPOTIFY_API_KEY;
            console.log('Spotify API key exists:', !!spotifyKey);

            if (!spotifyKey) {
                console.error('❌ Spotify API key missing');
                setError('Spotify API key not configured - please contact support');
                return;
            }

            // Phase 3: Initialize generation process
            console.log('⏳ Setting loading state...');
            setLoading(true);
            setError(null);
            setPlaylistCreated(false);
            setTracks([]);

            console.log('🎵 Calling sophisticated recommendation engine...');
            console.log('Parameters:', { weatherMain, playlistLength, allowExplicit });
            
            /**
             * Execute the core recommendation algorithm
             * 
             * This calls the SpotifyAuth.getRecommendations method which implements
             * a sophisticated search-based music discovery system that:
             * 
             * - Maps weather conditions to musical characteristics
             * - Generates diverse search queries from multiple strategies
             * - Executes searches across regional markets for availability
             * - Filters results for quality and appropriateness
             * - Ensures artist variety and removes duplicates
             * - Applies explicit content filtering based on user preference
             * 
             * This approach provides more control and transparency than
             * traditional recommendation APIs while ensuring high-quality,
             * weather-appropriate music selection.
             */
            const recommendedTracks = await spotifyAuth.getRecommendations(weatherMain, playlistLength, allowExplicit);
            
            console.log('✅ Recommendations received:', recommendedTracks);
            console.log('Number of tracks:', recommendedTracks?.length || 0);

            // Phase 4: Validate generation results
            if (!recommendedTracks || recommendedTracks.length === 0) {
                console.error('❌ No tracks in recommendations');
                throw new Error('Unable to generate playlist. This may be due to API restrictions or regional limitations. Please try again.');
            }

            // Phase 5: Update application state with successful results
            console.log('✅ Setting final tracks...');
            setTracks(recommendedTracks);
            setPlaylistCreated(true);
            
            console.log(`🎉 SUCCESS: Generated ${recommendedTracks.length} tracks`);

        } catch (error) {
            /**
             * Comprehensive error handling for various failure scenarios
             * 
             * Provides specific user feedback based on error type to help
             * users understand and potentially resolve issues:
             * 
             * - Configuration errors: Direct users to support
             * - Rate limiting: Advise waiting and retry timing
             * - Authentication failures: Explain regional restrictions
             * - Content filtering: Suggest preference adjustments
             * - Network issues: Provide retry guidance
             */
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

    // ========================================================================
    // PAGINATION MANAGEMENT
    // ========================================================================
    
    /**
     * Navigate to specific page in paginated track display
     * 
     * Updates the current page state to show different subset of tracks.
     * Enables smooth navigation through large playlists without performance impact.
     * 
     */
    const goToPage = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    /**
     * Generate intelligent pagination controls
     * 
     * Creates smart pagination that shows limited number of page buttons
     * to prevent UI overflow with very large playlists. Uses sliding window
     * approach centered around current page for optimal navigation.
     * 
     * @returns {Array<number>} Array of page numbers to display as buttons
     */
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total count is manageable
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show sliding window of pages centered around current page
            const start = Math.max(1, currentPage - 2);
            const end = Math.min(totalPages, start + maxVisiblePages - 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }
        return pages;
    };

    // ========================================================================
    // SPOTIFY PLAYLIST INTEGRATION
    // ========================================================================
    
    /**
     * Create and save playlist to user's Spotify account
     * 
     * This function handles the complete playlist creation workflow:
     * 
     * 1. AUTHENTICATION VALIDATION:
     *    - Verifies user is logged in to Spotify
     *    - Confirms valid authentication tokens
     * 
     * 2. PLAYLIST CREATION:
     *    - Retrieves user profile information
     *    - Creates playlist with weather-themed naming
     *    - Sets appropriate privacy and description
     * 
     * 3. CONTENT POPULATION:
     *    - Converts track objects to Spotify URIs
     *    - Batch adds all tracks to the new playlist
     *    - Handles API rate limits and errors gracefully
     * 
     * 4. USER EXPERIENCE:
     *    - Provides success feedback with playlist link
     *    - Opens playlist in Spotify for immediate access
     *    - Handles various error scenarios with helpful messages
     * 
     * The created playlist includes rich metadata describing the weather
     * conditions and generation process for user reference.
     */
    const createSpotifyPlaylist = async () => {
        console.log('🎵 Create Spotify playlist clicked');
        
        // Validation Phase: Ensure prerequisites are met
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
            // Phase 1: Get user profile for playlist ownership
            console.log('👤 Getting user profile...');
            const user = await spotifyAuth.getUserProfile();
            console.log('User profile:', user);
            
            // Phase 2: Create playlist with descriptive metadata
            console.log('📝 Creating playlist...');
            const playlist = await spotifyAuth.createPlaylist(
                user.id,
                `${cityName} - ${weatherMain} Vibes`,
                `Perfect playlist for ${weatherMain.toLowerCase()} weather in ${cityName}. Generated with ${tracks.length} tracks using WeatherBeats.`,
                false // Private playlist for user privacy
            );
            
            console.log('Playlist created:', playlist);

            // Phase 3: Populate playlist with curated tracks
            console.log('➕ Adding tracks to playlist...');
            const trackUris = tracks.map(track => track.uri);
            
            await spotifyAuth.addTracksToPlaylist(playlist.id, trackUris);

            // Phase 4: Provide success feedback and access
            alert(`Playlist "${playlist.name}" created successfully! Check your Spotify app.`);
            
            // Open playlist in Spotify for immediate access
            if (playlist.external_urls?.spotify) {
                window.open(playlist.external_urls.spotify, '_blank');
            }

        } catch (error) {
            /**
             * Handle playlist creation errors with specific guidance
             * 
             * Common issues include:
             * - Authentication token expiration
             * - Insufficient permissions or scope
             * - API rate limiting during peak usage
             * - Network connectivity problems
             */
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

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================
    
    /**
     * Format track duration from milliseconds to human-readable format
     * 
     * Converts Spotify's standard duration format (milliseconds) to
     * familiar MM:SS format for better user experience.
     * 
     * @returns {string} Formatted duration string (e.g., "3:42")
     */
    const formatDuration = (durationMs) => {
        const minutes = Math.floor(durationMs / 60000);
        const seconds = ((durationMs % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds.padStart(2, '0')}`;
    };

    // ========================================================================
    // COMPONENT RENDER
    // ========================================================================
    
    /**
     * Render sophisticated playlist interface with conditional states
     * 
     * The component renders different interfaces based on current state:
     * 
     * 1. INITIAL STATE: Generation interface with settings preview
     * 2. LOADING STATE: Progress indicators during processing
     * 3. SUCCESS STATE: Rich track display with interaction options
     * 4. ERROR STATE: Helpful error messages with recovery options
     * 
     * Features progressive disclosure of functionality based on user
     * authentication status and generation progress.
     */
    return (
        <div className="playlists-container">
            <div>
                <h2>Your Weather Playlist</h2>
            </div>
            
            {/* ================================================================ */}
            {/* INITIAL STATE - Playlist Generation Interface */}
            {/* ================================================================ */}
            {!playlistCreated && (
                <div>
                    <p>
                        Ready to create your perfect playlist for today's weather in {cityName}?
                    </p>
                    
                    {/* Primary generation button with intelligent loading states */}
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
                    
                    {/* Transparent information about current generation settings */}
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

            {/* ================================================================ */}
            {/* SUCCESS STATE - Rich Track Display Interface */}
            {/* ================================================================ */}
            {playlistCreated && tracks.length > 0 && (
                <div className="playlist-results">
                    <h3>Generated Playlist ({tracks.length} tracks)</h3>
                    
                    {/* ========================================================== */}
                    {/* TRACK LIST - Paginated display with rich metadata */}
                    {/* ========================================================== */}
                    <div className="track-list">
                        {currentTracks.map((track, index) => {
                            return (
                                <div key={track.id} className="track-item">
                                    <div className="track-info-row">
                                        {/* Track number with pagination awareness */}
                                        <span className="track-number">
                                            {startIndex + index + 1}.
                                        </span>
                                        
                                        {/* Album artwork with intelligent fallback handling */}
                                        <img 
                                            src={track.album.images?.[2]?.url || track.album.images?.[0]?.url} 
                                            alt={`${track.album.name} cover`}
                                            width="50"
                                            height="50"
                                            className="album-art"
                                            onError={(e) => {
                                                // Graceful fallback to generated placeholder if image fails
                                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEgzMFYzMEgzMFYyMFpNMjIgMjhWMjNIMjRWMjVIMjdWMjdIMjRWMjhIMjJaIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo=';
                                            }}
                                        />
                                        
                                        {/* Comprehensive track information display */}
                                        <div className="track-details">
                                            <div className="track-name">
                                                {track.name}
                                                {/* Explicit content indicator for parental guidance */}
                                                {track.explicit && <span className="explicit-badge">E</span>}
                                            </div>
                                            <div className="track-artist">
                                                {/* Handle multiple artists with proper formatting */}
                                                {track.artists.map(artist => artist.name).join(', ')}
                                            </div>
                                            <div className="track-album">
                                                {track.album.name}
                                            </div>
                                        </div>

                                        {/* Track metadata for user reference */}
                                        <div className="track-meta">
                                            <span className="track-duration">
                                                {formatDuration(track.duration_ms)}
                                            </span>
                                        </div>

                                        {/* Direct link to Spotify for immediate playback */}
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

                    {/* ========================================================== */}
                    {/* PAGINATION CONTROLS - Smart navigation for large playlists */}
                    {/* ========================================================== */}
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

                    {/* ========================================================== */}
                    {/* ACTION BUTTONS - Playlist management and regeneration */}
                    {/* ========================================================== */}
                    <div className="playlist-actions">
                        {/* Save to Spotify - Creates permanent playlist in user's account */}
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
                        
                        {/* Regenerate - Create new playlist with same weather/settings */}
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

            {/* ================================================================ */}
            {/* ERROR STATE - Comprehensive error feedback and recovery options */}
            {/* ================================================================ */}
            {error && (
                <div className={`error-message ${error.includes('✅') ? 'success-info' : 'error-info'}`}>
                    {error}
                </div>
            )}
        </div>
    );
}

export default Playlists;