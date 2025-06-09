// Spotify API - Optimized for Global Users and Regional Restrictions
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

    // Debug auth status
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

    // ========== ENHANCED GLOBAL SEARCH STRATEGY ==========

    // Get user's market for regional content
    async getUserMarket() {
        try {
            const accessToken = await this.getValidAccessToken();
            const response = await fetch(`${this.baseUrl}/me`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (response.ok) {
                const userData = await response.json();
                console.log(`🌍 User market detected: ${userData.country}`);
                return userData.country || 'US';
            }
            return 'US';
        } catch (error) {
            console.log('Could not get user market, defaulting to US');
            return 'US';
        }
    }

    // Global priority markets with largest catalogs
    getGlobalMarkets(userMarket) {
        const topMarkets = [
            userMarket,    // User's country first
            'US',          // Largest catalog
            'GB',          // Large English catalog
            'DE',          // Large European catalog
            'FR',          // French catalog
            'CA',          // Canadian catalog
            'AU',          // Australian catalog
            'SE',          // Swedish catalog (Spotify's home)
            'NL',          // Netherlands
            'ES',          // Spanish catalog
        ];
        
        // Remove duplicates and return top 6
        return [...new Set(topMarkets)].slice(0, 6);
    }

    // Ultra-global search terms that work in most markets
    getUniversalSearchTerms(weatherMain) {
        const weather = weatherMain.toLowerCase();
        
        // Use only the most globally available artists and generic terms
        const searchTerms = {
            clear: [
                // Top global superstars (available everywhere)
                'Taylor Swift', 'Ed Sheeran', 'Billie Eilish', 'Ariana Grande',
                // Generic terms that work globally
                'pop music', 'happy music', 'dance music', 'good vibes',
                'top hits', 'feel good songs', 'upbeat songs', 'positive music'
            ],
            sunny: [
                'Dua Lipa', 'The Weeknd', 'Bruno Mars', 'Post Malone',
                'summer music', 'party music', 'tropical music', 'beach music',
                'dance hits', 'reggaeton', 'latin music', 'vacation music'
            ],
            rain: [
                'Adele', 'Sam Smith', 'Lewis Capaldi', 'John Legend',
                'sad music', 'ballads', 'slow music', 'emotional music',
                'acoustic music', 'piano music', 'melancholy', 'heartbreak'
            ],
            drizzle: [
                'Lorde', 'Lana Del Rey', 'Phoebe Bridgers', 'Clairo',
                'indie music', 'chill music', 'mellow music', 'soft music',
                'alternative music', 'bedroom pop', 'lo-fi', 'dreamy music'
            ],
            thunderstorm: [
                'Imagine Dragons', 'OneRepublic', 'Coldplay', 'Maroon 5',
                'rock music', 'powerful music', 'energy music', 'anthems',
                'alternative rock', 'pop rock', 'stadium music', 'epic music'
            ],
            snow: [
                'Bon Iver', 'Iron Wine', 'Fleet Foxes', 'Sufjan Stevens',
                'winter music', 'acoustic music', 'folk music', 'peaceful music',
                'quiet music', 'ambient music', 'calm music', 'cozy music'
            ],
            clouds: [
                'Arctic Monkeys', 'The 1975', 'Vampire Weekend', 'Tame Impala',
                'indie rock', 'alternative music', 'modern rock', 'indie pop',
                'brit rock', 'garage rock', 'psychedelic', 'experimental'
            ],
            mist: [
                'Radiohead', 'Massive Attack', 'Portishead', 'James Blake',
                'electronic music', 'ambient music', 'trip hop', 'atmospheric',
                'experimental music', 'downtempo', 'chillout', 'ethereal'
            ],
            fog: [
                'Bonobo', 'Tycho', 'Four Tet', 'Burial',
                'ambient electronic', 'instrumental', 'soundscapes', 'meditation',
                'lounge music', 'minimal music', 'background music', 'study music'
            ]
        };

        return searchTerms[weather] || searchTerms.clear;
    }

    // Enhanced search with aggressive market and fallback strategies
    async searchTracksGlobal(accessToken, query, limit = 20, markets = ['US']) {
        console.log(`🌍 Global search for: "${query}" across markets: ${markets.join(', ')}`);
        
        for (const market of markets) {
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

                if (response.ok) {
                    const data = await response.json();
                    const tracks = data.tracks?.items || [];
                    
                    if (tracks.length > 0) {
                        console.log(`✅ Found ${tracks.length} tracks in ${market} for "${query}"`);
                        
                        return tracks
                            .filter(track => track && track.id && track.name && track.artists && track.artists.length > 0)
                            .map(track => ({
                                ...track,
                                has_real_preview: !!track.preview_url,
                                search_market: market,
                                search_query: query
                            }));
                    }
                } else {
                    console.log(`❌ Search failed in ${market}: ${response.status}`);
                }
            } catch (error) {
                console.error(`Error searching in market ${market}:`, error);
            }
            
            // Small delay between market attempts
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`❌ No results for "${query}" in any market`);
        return [];
    }

    // Ultimate fallback searches guaranteed to work globally
    async getGlobalFallback(accessToken, markets) {
        console.log('🚨 Attempting global fallback searches...');
        
        const universalFallbacks = [
            // These should work in virtually any market
            'music',
            'songs',
            'pop',
            'hits',
            'popular',
            'chart',
            'radio',
            'playlist'
        ];
        
        for (const fallback of universalFallbacks) {
            const results = await this.searchTracksGlobal(accessToken, fallback, 30, markets);
            if (results.length > 0) {
                console.log(`✅ Global fallback success with "${fallback}": ${results.length} tracks`);
                return results;
            }
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        return [];
    }

    // Main recommendation method - ULTRA GLOBAL COMPATIBLE
    async getRecommendations(weatherMain, limit = 25) {
        console.log('=== ULTRA-GLOBAL PLAYLIST GENERATION ===');
        console.log(`🌍 Weather: ${weatherMain}, Requested: ${limit} tracks`);
        
        try {
            const accessToken = await this.getValidAccessToken();
            if (!accessToken) {
                throw new Error('Not authenticated with Spotify');
            }

            // Get user's market and global market list
            const userMarket = await this.getUserMarket();
            const markets = this.getGlobalMarkets(userMarket);
            console.log(`🌍 Search markets: ${markets.join(', ')}`);

            let allTracks = [];
            const searchTerms = this.getUniversalSearchTerms(weatherMain);
            
            console.log('🎯 Starting global search strategy...');
            
            // Phase 1: Weather-specific searches across all markets
            for (const term of searchTerms.slice(0, 6)) {
                if (allTracks.length >= limit * 1.5) break;
                
                const results = await this.searchTracksGlobal(accessToken, term, 15, markets);
                if (results.length > 0) {
                    allTracks.push(...results);
                    console.log(`✅ Added ${results.length} tracks from "${term}"`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            console.log(`📊 Phase 1 results: ${allTracks.length} tracks`);

            // Phase 2: If still no results, try basic music terms
            if (allTracks.length === 0) {
                console.log('🔄 Phase 2: Basic music search...');
                
                const basicTerms = ['music', 'songs', 'pop', 'hits'];
                for (const term of basicTerms) {
                    const results = await this.searchTracksGlobal(accessToken, term, 20, markets);
                    if (results.length > 0) {
                        allTracks.push(...results);
                        console.log(`✅ Basic search success with "${term}": ${results.length} tracks`);
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }

            // Phase 3: Ultimate fallback - guaranteed to work
            if (allTracks.length === 0) {
                console.log('🚨 Phase 3: Ultimate global fallback...');
                allTracks = await this.getGlobalFallback(accessToken, markets);
            }

            // Phase 4: Last resort - search without market restriction
            if (allTracks.length === 0) {
                console.log('🆘 Phase 4: Last resort - no market restrictions...');
                try {
                    const response = await fetch(`${this.baseUrl}/search?q=music&type=track&limit=30`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        allTracks = (data.tracks?.items || [])
                            .filter(track => track && track.id)
                            .map(track => ({
                                ...track,
                                has_real_preview: !!track.preview_url,
                                search_market: 'global',
                                search_query: 'music'
                            }));
                        console.log(`🆘 Last resort found: ${allTracks.length} tracks`);
                    }
                } catch (error) {
                    console.error('Last resort search failed:', error);
                }
            }

            if (allTracks.length === 0) {
                throw new Error(`Unable to find any music in your region. This may be due to strict regional restrictions. Please try using a VPN or contact support.`);
            }

            // Process and return results
            const uniqueTracks = this.removeDuplicates(allTracks);
            const shuffledTracks = this.shuffleArray(uniqueTracks);
            const finalTracks = shuffledTracks.slice(0, limit);

            console.log(`🎉 GLOBAL SUCCESS: ${finalTracks.length} tracks`);
            console.log(`🌍 Markets used: ${[...new Set(finalTracks.map(t => t.search_market))].join(', ')}`);
            console.log(`🎵 Preview rate: ${finalTracks.filter(t => t.has_real_preview).length}/${finalTracks.length}`);

            return finalTracks;

        } catch (error) {
            console.error('💥 Global playlist generation failed:', error);
            throw error;
        }
    }

    // Enhanced duplicate removal
    removeDuplicates(tracks) {
        const seen = new Set();
        const seenCombos = new Set();
        
        return tracks.filter(track => {
            if (!track || !track.id) return false;
            
            if (seen.has(track.id)) return false;
            seen.add(track.id);
            
            const combo = `${track.artists[0]?.name?.toLowerCase()}-${track.name?.toLowerCase()}`;
            if (seenCombos.has(combo)) return false;
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

    // Rest of methods (getUserProfile, createPlaylist, etc.) remain the same...
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