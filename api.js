// Spotify API - Updated for November 2024 API changes
const spotify_API_KEY = import.meta.env.VITE_SPOTIFY_API_KEY;

// Spotify Authentication 
export class SpotifyAuth {
    constructor() {
        this.clientId = `${spotify_API_KEY}`;
        this.redirectUri = import.meta.env.PROD ? '' : 'http://127.0.0.1:5173';
        this.scope = 'playlist-modify-public playlist-modify-private user-read-private user-read-email user-library-read user-top-read playlist-read-private user-read-recently-played';
        this.baseUrl = 'https://api.spotify.com/v1';
    }

    // Generate random string for PKCE
    generateRandomString(length) {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce((acc, x) => acc + possible[x % possible.length], "");
    }

    // Create SHA256 hash and base64url encode
    async sha256(plain) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plain);
        return window.crypto.subtle.digest('SHA-256', data);
    }

    // Base64url encode
    base64urlencode(str) {
        return btoa(String.fromCharCode.apply(null, [...new Uint8Array(str)]))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    // Start the authorization flow
    async authorize() {
        const codeVerifier = this.generateRandomString(64);
        const hashed = await this.sha256(codeVerifier);
        const codeChallenge = this.base64urlencode(hashed);

        localStorage.setItem('code_verifier', codeVerifier);

        const authUrl = new URL("https://accounts.spotify.com/authorize");
        const params = {
            response_type: 'code',
            client_id: this.clientId,
            scope: this.scope,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            redirect_uri: this.redirectUri,
        };

        authUrl.search = new URLSearchParams(params).toString();
        window.location.href = authUrl.toString();
    }

    // Exchange authorization code for access token
    async getAccessToken(code) {
        const codeVerifier = localStorage.getItem('code_verifier');

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: this.clientId,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: this.redirectUri,
                code_verifier: codeVerifier,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('token_expires_at', Date.now() + (data.expires_in * 1000));
        localStorage.removeItem('code_verifier');

        return data.access_token;
    }

    // Refresh access token
    async refreshAccessToken() {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: this.clientId,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to refresh token: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('token_expires_at', Date.now() + (data.expires_in * 1000));
        
        if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
        }

        return data.access_token;
    }

    // Get current valid access token
    async getValidAccessToken() {
        const accessToken = localStorage.getItem('access_token');
        const expiresAt = localStorage.getItem('token_expires_at');

        if (accessToken && expiresAt && Date.now() < parseInt(expiresAt)) {
            return accessToken;
        }

        try {
            return await this.refreshAccessToken();
        } catch (error) {
            throw new Error('Authentication required');
        }
    }

    // Check if user is logged in
    isLoggedIn() {
        const accessToken = localStorage.getItem('access_token');
        const expiresAt = localStorage.getItem('token_expires_at');
        
        return accessToken && expiresAt && Date.now() < parseInt(expiresAt);
    }

    // Logout
    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expires_at');
        localStorage.removeItem('code_verifier');
    }

    // ========== ADAPTED FOR 2024 SPOTIFY API CHANGES ==========

    // Create mock preview URLs for tracks that don't have them
    createMockPreviewUrl(track) {
        // Create a data URL with track info - this won't play but won't break the UI
        return `data:audio/mp3;base64,${btoa(`Track: ${track.name} by ${track.artists[0].name}`)}`;
    }

    // Enhanced search that works with 2024 API limitations
    async searchTracks(accessToken, query, limit = 20) {
        console.log(`🔍 Searching for: "${query}"`);
        
        const params = new URLSearchParams({
            q: query,
            type: 'track',
            limit: Math.min(limit, 50),
            market: 'US'
        });

        try {
            const response = await fetch(`${this.baseUrl}/search?${params}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Search failed for "${query}": ${response.status} - ${errorText}`);
                return [];
            }

            const data = await response.json();
            const tracks = data.tracks?.items || [];
            
            console.log(`📊 Raw results for "${query}": ${tracks.length} tracks`);
            
            // Check how many have real preview URLs
            const tracksWithRealPreviews = tracks.filter(track => track && track.preview_url);
            console.log(`🎵 Tracks with REAL previews for "${query}": ${tracksWithRealPreviews.length}/${tracks.length}`);
            
            // Post-2024 API: Many tracks don't have preview_url anymore
            // We'll enhance tracks without previews for UI compatibility
            const enhancedTracks = tracks
                .filter(track => track && track.id && track.name && track.artists && track.artists.length > 0)
                .map(track => {
                    // If no preview_url, we'll mark it but keep the track
                    if (!track.preview_url) {
                        return {
                            ...track,
                            preview_url: null, // Explicitly set to null for UI handling
                            has_real_preview: false
                        };
                    }
                    return {
                        ...track,
                        has_real_preview: true
                    };
                });
            
            console.log(`✅ Enhanced tracks for "${query}": ${enhancedTracks.length} (${tracksWithRealPreviews.length} with real previews)`);
            
            return enhancedTracks;

        } catch (error) {
            console.error(`Error searching for "${query}":`, error);
            return [];
        }
    }

    // Get weather-appropriate artists and terms
    getWeatherSearchTerms(weatherMain) {
        const weather = weatherMain.toLowerCase();
        
        const searchTerms = {
            clear: [
                'Taylor Swift happy', 'Ed Sheeran upbeat', 'Dua Lipa dance', 'Bruno Mars party',
                'pop hits 2024', 'summer vibes', 'feel good music', 'upbeat playlist'
            ],
            sunny: [
                'Harry Styles golden', 'Lizzo good as hell', 'Pharrell happy', 'OneRepublic sunshine',
                'pop summer hits', 'dance music', 'good vibes only', 'party playlist'
            ],
            rain: [
                'Billie Eilish sad', 'Lorde melodrama', 'The Weeknd melancholy', 'Adele heartbreak',
                'sad songs playlist', 'rainy day music', 'emotional ballads', 'indie melancholy'
            ],
            drizzle: [
                'Bon Iver quiet', 'Lana Del Rey rain', 'James Blake acoustic', 'Phoebe Bridgers sad',
                'acoustic rain songs', 'soft indie music', 'mellow playlist', 'chill sad songs'
            ],
            thunderstorm: [
                'Imagine Dragons thunder', 'Foo Fighters energy', 'Linkin Park storm', 'The Killers electric',
                'rock anthems', 'intense music', 'high energy rock', 'powerful songs'
            ],
            snow: [
                'Bon Iver winter', 'Iron Wine quiet', 'Sufjan Stevens snow', 'Fleet Foxes peaceful',
                'winter songs', 'peaceful music', 'acoustic winter', 'calm playlist'
            ],
            clouds: [
                'The National indie', 'Vampire Weekend alternative', 'Tame Impala dreamy', 'Arctic Monkeys chill',
                'indie rock playlist', 'alternative music', 'thoughtful songs', 'indie hits'
            ],
            mist: [
                'FKA twigs ethereal', 'James Blake atmospheric', 'Thom Yorke ambient', 'Burial electronic',
                'ambient electronic', 'atmospheric music', 'dreamy electronic', 'ethereal playlist'
            ],
            fog: [
                'Massive Attack trip hop', 'Portishead atmospheric', 'Bonobo ambient', 'Tycho chill',
                'trip hop playlist', 'atmospheric electronic', 'ambient music', 'downtempo'
            ]
        };

        return searchTerms[weather] || searchTerms.clear;
    }

    // Main recommendation method adapted for 2024 API
    async getRecommendations(weatherMain, limit = 25) {
        console.log('=== SPOTIFY API 2024 COMPATIBLE PLAYLIST GENERATION ===');
        console.log(`Weather: ${weatherMain}, Requested: ${limit} tracks`);
        console.log('ℹ️  Note: Post-Nov 2024 API changes may limit preview availability');
        
        try {
            const accessToken = await this.getValidAccessToken();
            if (!accessToken) {
                throw new Error('Not authenticated with Spotify');
            }

            console.log('✅ Access token obtained');

            let allTracks = [];
            const searchTerms = this.getWeatherSearchTerms(weatherMain);
            
            // Search with weather-appropriate terms
            console.log('🎯 Searching with weather-appropriate terms...');
            
            const tracksPerSearch = Math.ceil(limit * 1.5 / searchTerms.length);
            
            for (const term of searchTerms.slice(0, 6)) { // Limit searches to avoid rate limits
                if (allTracks.length >= limit * 2) break;
                
                const searchResults = await this.searchTracks(accessToken, term, tracksPerSearch);
                allTracks.push(...searchResults);
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.log(`📊 Total tracks found: ${allTracks.length}`);

            // Remove duplicates
            const uniqueTracks = this.removeDuplicates(allTracks);
            console.log(`📊 After deduplication: ${uniqueTracks.length} tracks`);

            // Check preview URL availability
            const tracksWithRealPreviews = uniqueTracks.filter(track => track.has_real_preview);
            const tracksWithoutPreviews = uniqueTracks.filter(track => !track.has_real_preview);
            
            console.log(`🎵 Preview breakdown:`);
            console.log(`   - With real previews: ${tracksWithRealPreviews.length}`);
            console.log(`   - Without previews: ${tracksWithoutPreviews.length}`);

            if (uniqueTracks.length === 0) {
                throw new Error('No tracks found. Please try again or check your connection.');
            }

            // Prioritize tracks with real previews, but include others for playlist creation
            const finalTracks = [
                ...tracksWithRealPreviews,
                ...tracksWithoutPreviews
            ].slice(0, limit);

            // Shuffle the results
            const shuffledTracks = this.shuffleArray(finalTracks);

            console.log(`🎉 SUCCESS: Returning ${shuffledTracks.length} tracks`);
            console.log(`🎵 Preview info: ${tracksWithRealPreviews.length} with previews, ${tracksWithoutPreviews.length} without`);
            
            // Show sample tracks
            console.log('🎵 Sample tracks:');
            shuffledTracks.slice(0, 3).forEach((track, i) => {
                const previewStatus = track.has_real_preview ? '🎵' : '🔇';
                console.log(`${i + 1}. ${previewStatus} ${track.name} by ${track.artists[0].name}`);
            });

            return shuffledTracks;

        } catch (error) {
            console.error('💥 Playlist generation failed:', error);
            throw error;
        }
    }

    // Simple duplicate removal
    removeDuplicates(tracks) {
        const seen = new Set();
        return tracks.filter(track => {
            if (!track || !track.id) return false;
            
            if (seen.has(track.id)) {
                return false;
            }
            seen.add(track.id);
            return true;
        });
    }

    // Shuffle array
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Debug method
    async debugAuthStatus() {
        console.log('=== DEBUGGING SPOTIFY AUTH ===');
        
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const expiresAt = localStorage.getItem('token_expires_at');
        
        console.log('Stored access token exists:', !!accessToken);
        console.log('Stored refresh token exists:', !!refreshToken);
        console.log('Token expires at:', expiresAt);
        console.log('Current time:', Date.now());
        console.log('Token expired:', expiresAt ? Date.now() > parseInt(expiresAt) : 'No expiry time');
        
        if (accessToken) {
            try {
                const response = await fetch('https://api.spotify.com/v1/me', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Token test response status:', response.status);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Token is valid! User:', data.display_name || data.id);
                    console.log('User country:', data.country);
                } else {
                    const errorText = await response.text();
                    console.error('Token test failed:', errorText);
                }
            } catch (error) {
                console.error('Token test error:', error);
            }
        }
        
        return {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            tokenExpired: expiresAt ? Date.now() > parseInt(expiresAt) : null,
            isLoggedIn: this.isLoggedIn()
        };
    }

    async getUserProfile() {
        const accessToken = await this.getValidAccessToken();
        if (!accessToken) {
            throw new Error('Not authenticated with Spotify');
        }

        try {
            const response = await fetch(`${this.baseUrl}/me`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get user profile: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    }

    async createPlaylist(userId, name, description = '', isPublic = false) {
        const accessToken = await this.getValidAccessToken();
        if (!accessToken) {
            throw new Error('Not authenticated with Spotify');
        }

        try {
            const response = await fetch(`${this.baseUrl}/users/${userId}/playlists`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    description,
                    public: isPublic
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create playlist: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating playlist:', error);
            throw error;
        }
    }

    async addTracksToPlaylist(playlistId, trackUris) {
        const accessToken = await this.getValidAccessToken();
        if (!accessToken) {
            throw new Error('Not authenticated with Spotify');
        }

        try {
            const response = await fetch(`${this.baseUrl}/playlists/${playlistId}/tracks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uris: trackUris
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to add tracks to playlist: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error adding tracks to playlist:', error);
            throw error;
        }
    }
}

// Weather API (unchanged)
const weather_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

export const getWeather = async (latitude, longitude) => {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${weather_API_KEY}&units=imperial`);
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Weather API response:', data);
        return data;
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw error;
    }
};