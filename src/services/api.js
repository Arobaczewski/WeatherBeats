// Spotify 
const spotify_API_KEY = import.meta.env.VITE_SPOTIFY_API_KEY;

export class SpotifyAuth {
    constructor() {
        this.clientId = `${spotify_API_KEY}`;
        this.redirectUri = 'https://weatherbeatz.netlify.app/';
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

    // ========== ENHANCED FOR GLOBAL COMPATIBILITY ==========

    // Get user's country for market-specific searches
    async getUserMarket() {
        try {
            const accessToken = await this.getValidAccessToken();
            const response = await fetch(`${this.baseUrl}/me`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (response.ok) {
                const userData = await response.json();
                return userData.country || 'US'; // Fallback to US
            }
            return 'US';
        } catch (error) {
            console.log('Could not get user market, defaulting to US');
            return 'US';
        }
    }

    // Enhanced search with multiple markets and fallbacks
    async searchTracks(accessToken, query, limit = 20, userMarket = 'US') {
        console.log(`🔍 Searching for: "${query}" in market: ${userMarket}`);
        
        // Try multiple markets for better global coverage
        const marketsToTry = [
            userMarket,           // User's country first
            'US',                 // US market (largest)
            'GB',                 // UK market
            'DE',                 // German market
            'FR',                 // French market
            'ES',                 // Spanish market
            'AU',                 // Australian market
        ];

        // Remove duplicates and limit to first 3 markets
        const uniqueMarkets = [...new Set(marketsToTry)].slice(0, 3);

        for (const market of uniqueMarkets) {
            try {
                const params = new URLSearchParams({
                    q: query,
                    type: 'track',
                    limit: Math.min(limit, 50),
                    market: market
                });

                const response = await fetch(`${this.baseUrl}/search?${params}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                if (!response.ok) {
                    console.log(`Search failed for market ${market}: ${response.status}`);
                    continue; // Try next market
                }

                const data = await response.json();
                const tracks = data.tracks?.items || [];
                
                console.log(`📊 Results for "${query}" in ${market}: ${tracks.length} tracks`);
                
                if (tracks.length > 0) {
                    // Filter and enhance tracks
                    const validTracks = tracks
                        .filter(track => track && track.id && track.name && track.artists && track.artists.length > 0)
                        .map(track => ({
                            ...track,
                            has_real_preview: !!track.preview_url,
                            search_market: market // Track which market provided this result
                        }));
                    
                    console.log(`✅ Valid tracks from ${market}: ${validTracks.length}`);
                    return validTracks;
                }
            } catch (error) {
                console.error(`Error searching in market ${market}:`, error);
                continue; // Try next market
            }
        }

        console.log(`❌ No results found in any market for: "${query}"`);
        return [];
    }

    // More diverse and globally relevant search terms
    getGlobalWeatherSearchTerms(weatherMain) {
        const weather = weatherMain.toLowerCase();
        
        const searchTerms = {
            clear: [
                // Popular global artists
                'Ed Sheeran', 'Taylor Swift', 'Billie Eilish', 'The Weeknd', 'Dua Lipa',
                // Genre terms that work globally
                'pop hits', 'happy songs', 'upbeat music', 'feel good', 'sunshine',
                // Universal mood terms
                'good vibes', 'positive music', 'summer hits', 'dance pop'
            ],
            sunny: [
                'Bruno Mars', 'Harry Styles', 'Olivia Rodrigo', 'Doja Cat', 'Post Malone',
                'summer songs', 'tropical house', 'reggaeton', 'afrobeats', 'party music',
                'beach vibes', 'vacation music', 'latin pop', 'island music'
            ],
            rain: [
                'Adele', 'Sam Smith', 'Lewis Capaldi', 'Billie Eilish', 'Lorde',
                'sad songs', 'rainy day', 'melancholy', 'emotional ballads', 'indie sad',
                'acoustic rain', 'heartbreak songs', 'slow songs', 'piano ballads'
            ],
            drizzle: [
                'Bon Iver', 'Phoebe Bridgers', 'Lana Del Rey', 'Clairo', 'Rex Orange County',
                'chill indie', 'soft rock', 'bedroom pop', 'lo-fi', 'mellow',
                'acoustic chill', 'indie folk', 'dreamy pop', 'soft indie'
            ],
            thunderstorm: [
                'Imagine Dragons', 'OneRepublic', 'Maroon 5', 'Coldplay', 'Linkin Park',
                'epic music', 'powerful songs', 'anthems', 'rock hits', 'intense music',
                'stadium rock', 'alt rock', 'energetic', 'driving music'
            ],
            snow: [
                'Bon Iver', 'Fleet Foxes', 'Iron & Wine', 'The Paper Kites', 'Daughter',
                'winter songs', 'acoustic folk', 'indie winter', 'peaceful music', 'calm',
                'ambient folk', 'quiet songs', 'cozy music', 'fireside songs'
            ],
            clouds: [
                'Arctic Monkeys', 'Tame Impala', 'The 1975', 'Vampire Weekend', 'Foster the People',
                'indie rock', 'alternative', 'modern rock', 'indie pop', 'brit pop',
                'garage rock', 'indie alternative', 'modern alternative', 'cool indie'
            ],
            mist: [
                'James Blake', 'FKA twigs', 'Thom Yorke', 'Radiohead', 'Massive Attack',
                'electronic', 'ambient', 'trip hop', 'atmospheric', 'experimental',
                'downtempo', 'chillwave', 'synth pop', 'dream pop'
            ],
            fog: [
                'Portishead', 'Bonobo', 'Tycho', 'Burial', 'Four Tet',
                'ambient electronic', 'chillout', 'lounge', 'minimal', 'soundscapes',
                'instrumental', 'electronic ambient', 'chill electronic', 'meditation music'
            ]
        };

        return searchTerms[weather] || searchTerms.clear;
    }

    // Enhanced recommendation method with global market support
    async getRecommendations(weatherMain, limit = 25) {
        console.log('=== ENHANCED GLOBAL PLAYLIST GENERATION ===');
        console.log(`Weather: ${weatherMain}, Requested: ${limit} tracks`);
        
        try {
            const accessToken = await this.getValidAccessToken();
            if (!accessToken) {
                throw new Error('Not authenticated with Spotify');
            }

            console.log('✅ Access token obtained');

            // Get user's market for localized results
            const userMarket = await this.getUserMarket();
            console.log(`🌍 User market: ${userMarket}`);

            let allTracks = [];
            const searchTerms = this.getGlobalWeatherSearchTerms(weatherMain);
            
            console.log('🎯 Starting search with global terms...');
            
            // Search with multiple terms across different markets
            const tracksPerSearch = Math.ceil((limit * 2) / Math.min(searchTerms.length, 8));
            
            for (const term of searchTerms.slice(0, 8)) { // Limit to 8 searches
                if (allTracks.length >= limit * 2) break;
                
                const searchResults = await this.searchTracks(accessToken, term, tracksPerSearch, userMarket);
                
                if (searchResults.length > 0) {
                    allTracks.push(...searchResults);
                    console.log(`✅ Added ${searchResults.length} tracks from "${term}"`);
                } else {
                    console.log(`⚠️ No results for "${term}" - continuing...`);
                }
                
                // Delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 150));
            }
            
            console.log(`📊 Total tracks collected: ${allTracks.length}`);

            // Enhanced fallback if still no results
            if (allTracks.length === 0) {
                console.log('🔄 No results found, trying global fallback...');
                
                const globalFallbacks = [
                    'top 50 global', 'viral 50 global', 'today top hits', 
                    'global top 50', 'trending music', 'popular music'
                ];
                
                for (const fallback of globalFallbacks) {
                    const fallbackResults = await this.searchTracks(accessToken, fallback, 20, 'US');
                    if (fallbackResults.length > 0) {
                        allTracks.push(...fallbackResults);
                        console.log(`✅ Fallback success with "${fallback}": ${fallbackResults.length} tracks`);
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

            if (allTracks.length === 0) {
                throw new Error(`No tracks found for ${weatherMain} weather. This might be due to regional restrictions or temporary API issues. Please try again.`);
            }

            // Remove duplicates and prepare final list
            const uniqueTracks = this.removeDuplicates(allTracks);
            console.log(`📊 After deduplication: ${uniqueTracks.length} tracks`);

            // Check preview availability
            const tracksWithPreviews = uniqueTracks.filter(track => track.has_real_preview);
            console.log(`🎵 Tracks with previews: ${tracksWithPreviews.length}/${uniqueTracks.length}`);

            // Shuffle and return requested amount
            const shuffledTracks = this.shuffleArray(uniqueTracks).slice(0, limit);

            console.log(`🎉 SUCCESS: Returning ${shuffledTracks.length} tracks`);
            console.log(`🌍 Markets used: ${[...new Set(shuffledTracks.map(t => t.search_market))].join(', ')}`);

            return shuffledTracks;

        } catch (error) {
            console.error('💥 Playlist generation failed:', error);
            
            // Enhanced error messaging
            if (error.message.includes('403') || error.message.includes('Forbidden')) {
                throw new Error('Access denied - this might be due to geographic restrictions. Please try logging out and back in.');
            } else if (error.message.includes('429') || error.message.includes('rate limit')) {
                throw new Error('Too many requests - please wait a moment and try again.');
            } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                throw new Error('Authentication expired - please log out and back in.');
            }
            
            throw error;
        }
    }

    // Enhanced duplicate removal with better matching
    removeDuplicates(tracks) {
        const seen = new Set();
        const seenCombos = new Set();
        
        return tracks.filter(track => {
            if (!track || !track.id) return false;
            
            // Remove exact duplicates by ID
            if (seen.has(track.id)) {
                return false;
            }
            seen.add(track.id);
            
            // Remove near-duplicates by artist + track name combination
            const combo = `${track.artists[0]?.name?.toLowerCase()}-${track.name?.toLowerCase()}`;
            if (seenCombos.has(combo)) {
                return false;
            }
            seenCombos.add(combo);
            
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

// Weather API
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