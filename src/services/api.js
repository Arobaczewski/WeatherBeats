
// Rewritten Spotify API for post-November 2024 restrictions
// Uses only Search endpoint instead of removed Recommendations endpoint

export class SpotifyAuth {
    constructor() {
        this.clientId = import.meta.env.VITE_SPOTIFY_API_KEY;
        this.clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
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

    // Detect user's likely market/region
    detectUserMarket() {
        try {
            const language = navigator.language || navigator.userLanguage || 'en-US';
            const locale = language.toLowerCase();
            
            const marketMap = {
                'en-us': 'US', 'en-gb': 'GB', 'en-ca': 'CA', 'en-au': 'AU',
                'fr-fr': 'FR', 'fr-ca': 'CA', 'de-de': 'DE', 'de-at': 'DE',
                'es-es': 'ES', 'es-mx': 'MX', 'pt-br': 'BR', 'pt-pt': 'PT',
                'it-it': 'IT', 'nl-nl': 'NL', 'sv-se': 'SE', 'no-no': 'NO',
                'da-dk': 'DK', 'fi-fi': 'FI', 'pl-pl': 'PL', 'ru-ru': 'RU',
                'ja-jp': 'JP', 'ko-kr': 'KR', 'zh-cn': 'CN', 'zh-tw': 'TW'
            };
            
            const detectedMarket = marketMap[locale] || 
                                 marketMap[locale.split('-')[0]] || 
                                 'US';
            
            console.log(`🌍 Detected user market: ${detectedMarket} (from locale: ${locale})`);
            return detectedMarket;
        } catch (error) {
            console.warn('Could not detect user market, defaulting to US:', error);
            return 'US';
        }
    }

    // Get market strategy prioritizing user's region
    getMarketStrategy(userMarket = 'US') {
        const globalMarkets = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'FI', 'BR', 'MX', 'JP'];
        
        const markets = [userMarket];
        globalMarkets.forEach(market => {
            if (market !== userMarket && !markets.includes(market)) {
                markets.push(market);
            }
        });
        
        return markets;
    }

    // Client Credentials Flow
    async getClientCredentialsToken() {
        console.log('🔑 Getting client credentials token...');
        
        if (!this.clientId) {
            throw new Error('Spotify Client ID not configured');
        }

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(this.clientId + ':' + (this.clientSecret || ''))
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Client credentials failed:', errorText);
                throw new Error(`Failed to get client credentials token: ${response.status}`);
            }

            const data = await response.json();
            
            // Store in sessionStorage and memory
            sessionStorage.setItem('spotify_client_access_token', data.access_token);
            sessionStorage.setItem('spotify_client_token_expiry', (Date.now() + (data.expires_in * 1000)).toString());
            
            this.clientAccessToken = data.access_token;
            this.clientTokenExpiry = Date.now() + (data.expires_in * 1000);
            
            console.log('✅ Client credentials token obtained');
            return data.access_token;
            
        } catch (error) {
            console.error('Client credentials error:', error);
            throw error;
        }
    }

    // Get valid client credentials token
    async getValidClientToken() {
        // Check memory first, then sessionStorage
        let accessToken = this.clientAccessToken || sessionStorage.getItem('spotify_client_access_token');
        let tokenExpiry = this.clientTokenExpiry || parseInt(sessionStorage.getItem('spotify_client_token_expiry') || '0');

        if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
            // Update memory cache if loaded from sessionStorage
            if (!this.clientAccessToken) {
                this.clientAccessToken = accessToken;
                this.clientTokenExpiry = tokenExpiry;
            }
            return accessToken;
        }

        return await this.getClientCredentialsToken();
    }

    // Start the authorization flow
    async authorize() {
        const codeVerifier = this.generateRandomString(64);
        const hashed = await this.sha256(codeVerifier);
        const codeChallenge = this.base64urlencode(hashed);

        // Store code verifier in sessionStorage (survives page redirect)
        sessionStorage.setItem('spotify_code_verifier', codeVerifier);

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
        const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
        
        if (!codeVerifier) {
            throw new Error('No code verifier found. Please restart the authentication process.');
        }

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
            // Clear the invalid code verifier
            sessionStorage.removeItem('spotify_code_verifier');
            throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Store tokens in sessionStorage for persistence across page reloads
        sessionStorage.setItem('spotify_access_token', data.access_token);
        sessionStorage.setItem('spotify_refresh_token', data.refresh_token);
        sessionStorage.setItem('spotify_token_expiry', (Date.now() + (data.expires_in * 1000)).toString());
        
        // Also store in memory for current session
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);
        
        // Clean up code verifier
        sessionStorage.removeItem('spotify_code_verifier');

        return data.access_token;
    }

    // Refresh access token
    async refreshAccessToken() {
        let refreshToken = this.refreshToken || sessionStorage.getItem('spotify_refresh_token');
        
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
            // Clear invalid tokens
            this.logout();
            throw new Error(`Failed to refresh token: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Store new tokens
        sessionStorage.setItem('spotify_access_token', data.access_token);
        sessionStorage.setItem('spotify_token_expiry', (Date.now() + (data.expires_in * 1000)).toString());
        
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);
        
        if (data.refresh_token) {
            sessionStorage.setItem('spotify_refresh_token', data.refresh_token);
            this.refreshToken = data.refresh_token;
        }

        return data.access_token;
    }

    // Get current valid access token
    async getValidAccessToken() {
        // Check memory first, then sessionStorage
        let accessToken = this.accessToken || sessionStorage.getItem('spotify_access_token');
        let tokenExpiry = this.tokenExpiry || parseInt(sessionStorage.getItem('spotify_token_expiry') || '0');

        if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
            // Update memory cache if it was loaded from sessionStorage
            if (!this.accessToken) {
                this.accessToken = accessToken;
                this.tokenExpiry = tokenExpiry;
                this.refreshToken = sessionStorage.getItem('spotify_refresh_token');
            }
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
        const accessToken = this.accessToken || sessionStorage.getItem('spotify_access_token');
        const tokenExpiry = this.tokenExpiry || parseInt(sessionStorage.getItem('spotify_token_expiry') || '0');
        
        return accessToken && tokenExpiry && Date.now() < tokenExpiry;
    }

    // Logout
    logout() {
        // Clear memory
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.clientAccessToken = null;
        this.clientTokenExpiry = null;
        
        // Clear sessionStorage
        sessionStorage.removeItem('spotify_access_token');
        sessionStorage.removeItem('spotify_refresh_token');
        sessionStorage.removeItem('spotify_token_expiry');
        sessionStorage.removeItem('spotify_code_verifier');
        sessionStorage.removeItem('spotify_client_access_token');
        sessionStorage.removeItem('spotify_client_token_expiry');
    }

    // Enhanced search with better error handling
    async searchTracks(query, limit = 20, market = 'US') {
        console.log(`🔍 Searching for: "${query}" in market: ${market}`);
        
        try {
            const accessToken = await this.getValidClientToken();
            
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
                const errorText = await response.text();
                console.error(`Search failed: ${response.status} - ${errorText}`);
                
                // Handle specific errors
                if (response.status === 429) {
                    throw new Error('Rate limited by Spotify - please wait and try again');
                } else if (response.status === 401) {
                    throw new Error('Authentication failed - please check API credentials');
                } else if (response.status === 403) {
                    throw new Error('Access forbidden - this may be due to regional restrictions');
                } else if (response.status === 400 && errorText.includes('market')) {
                    console.warn(`Market ${market} not supported for this query`);
                }
                
                return [];
            }

            const data = await response.json();
            const tracks = data.tracks?.items || [];
            
            console.log(`📊 Search results: ${tracks.length} tracks in ${market}`);
            
            return tracks
                .filter(track => track && track.id && track.name && track.artists && track.artists.length > 0)
                .map(track => ({
                    ...track,
                    search_market: market,
                    search_query: query,
                    available_markets: track.available_markets || []
                }));

        } catch (error) {
            console.error(`Error searching for "${query}" in ${market}:`, error);
            throw error;
        }
    }

    // MAIN METHOD: Search-based playlist generation (replaces getRecommendations)
    async getRecommendations(weatherMain, limit = 25, allowExplicit = true) {
        console.log('=== SEARCH-BASED PLAYLIST GENERATION ===');
        console.log(`🌍 Weather: ${weatherMain}, Target: ${limit} tracks, Allow Explicit: ${allowExplicit}`);
        
        try {
            let allTracks = [];
            const strategy = this.getWeatherSearchStrategies(weatherMain);
            
            // Detect user's market
            const userMarket = this.detectUserMarket();
            const marketList = this.getMarketStrategy(userMarket);
            
            console.log(`🎯 Primary market: ${userMarket}`);
            
            // Build comprehensive search queries
            const searchQueries = this.buildSearchQueries(strategy, weatherMain);
            console.log(`🚀 Starting search with ${searchQueries.length} queries...`);
            
            // Execute searches with rate limiting
            let queryIndex = 0;
            const maxQueries = Math.min(searchQueries.length, 20); // Limit to prevent rate limiting
            
            while (allTracks.length < limit * 1.5 && queryIndex < maxQueries) {
                const query = searchQueries[queryIndex];
                let querySuccess = false;
                
                // Try primary market first, then fallbacks
                for (let marketIndex = 0; marketIndex < Math.min(marketList.length, 3) && !querySuccess; marketIndex++) {
                    const market = marketList[marketIndex];
                    
                    try {
                        console.log(`🔍 Query ${queryIndex + 1}/${maxQueries}: "${query}" in ${market}`);
                        
                        const results = await this.searchTracks(query, 50, market);
                        
                        if (results.length > 0) {
                            // Filter for quality
                            const qualityTracks = this.filterTracksByQuality(results);
                            allTracks.push(...qualityTracks);
                            
                            console.log(`✅ Added ${qualityTracks.length} tracks (Total: ${allTracks.length})`);
                            querySuccess = true;
                        }
                        
                        // Rate limiting delay
                        await this.delay(200);
                        
                    } catch (error) {
                        console.error(`Search failed for "${query}" in ${market}:`, error);
                        
                        // If rate limited, wait longer
                        if (error.message.includes('Rate limited')) {
                            console.log('⏳ Rate limited - waiting 2 seconds...');
                            await this.delay(2000);
                        }
                        
                        continue;
                    }
                }
                
                queryIndex++;
                
                // Progressive delay to avoid rate limiting
                await this.delay(300);
            }
            
            if (allTracks.length === 0) {
                throw new Error('Unable to find tracks for this weather. This may be due to API restrictions or regional limitations. Please try again.');
            }

            // Process and finalize playlist
            console.log(`📦 Raw tracks collected: ${allTracks.length}`);
            
            // Remove duplicates
            const uniqueTracks = this.removeDuplicates(allTracks);
            console.log(`🧹 After deduplication: ${uniqueTracks.length} unique tracks`);
            
            // Filter explicit content if needed
            let filteredTracks = uniqueTracks;
            if (!allowExplicit) {
                filteredTracks = uniqueTracks.filter(track => !track.explicit);
                console.log(`🔞 After explicit filter: ${filteredTracks.length} tracks`);
            }
            
            if (filteredTracks.length === 0) {
                throw new Error('No tracks available after filtering. Try enabling explicit content.');
            }
            
            // Ensure variety and select final tracks
            const diverseTracks = this.ensureArtistVariety(filteredTracks);
            const shuffledTracks = this.shuffleArray(diverseTracks);
            const finalTracks = shuffledTracks.slice(0, limit);

            console.log(`🎉 SUCCESS: Generated ${finalTracks.length} tracks for ${weatherMain} weather`);
            console.log(`📈 Artist variety: ${new Set(finalTracks.map(t => t.artists[0]?.name)).size} different artists`);
            
            return finalTracks;

        } catch (error) {
            console.error('💥 Search-based playlist generation failed:', error);
            throw error;
        }
    }

    // Build comprehensive search queries based on weather
    buildSearchQueries(strategy, weatherMain) {
        const queries = [];
        
        // 1. Genre searches with year filters
        strategy.genres.forEach(genre => {
            queries.push(`genre:${genre}`);
            queries.push(`genre:${genre} year:2023-2024`);
            queries.push(`${genre} music`);
        });
        
        // 2. Artist searches
        strategy.artists.slice(0, 8).forEach(artist => {
            queries.push(`artist:"${artist}"`);
        });
        
        // 3. Mood-based searches
        strategy.moods.forEach(mood => {
            queries.push(`${mood} music`);
            queries.push(`${mood} songs 2024`);
        });
        
        // 4. Keyword searches
        strategy.keywords.forEach(keyword => {
            queries.push(keyword);
            queries.push(`${keyword} playlist`);
        });
        
        // 5. Weather-specific searches
        queries.push(`${weatherMain.toLowerCase()} weather`);
        queries.push(`${weatherMain.toLowerCase()} vibes`);
        queries.push(`${weatherMain.toLowerCase()} music`);
        
        // 6. Year-based searches for freshness
        const currentYear = new Date().getFullYear();
        queries.push(`year:${currentYear}`);
        queries.push(`year:${currentYear - 1}`);
        queries.push(`year:${currentYear - 2}`);
        
        // 7. Popular/trending searches
        queries.push('popular 2024');
        queries.push('trending');
        queries.push('top hits');
        queries.push('viral songs');
        
        // 8. Fallback searches
        queries.push('music');
        queries.push('songs');
        queries.push('playlist');
        
        // Shuffle to ensure variety
        return this.shuffleArray(queries);
    }

    // Filter tracks by quality metrics
    filterTracksByQuality(tracks) {
        return tracks.filter(track => {
            if (!track || !track.id || !track.name || !track.artists || track.artists.length === 0) {
                return false;
            }
            
            // Filter by duration (remove very short or very long tracks)
            if (track.duration_ms) {
                if (track.duration_ms < 30000 || track.duration_ms > 600000) {
                    return false;
                }
            }
            
            // Filter out obvious remixes and extended versions in title
            const name = track.name.toLowerCase();
            if (name.includes('extended mix') || name.includes('radio edit')) {
                return false;
            }
            
            // Filter out tracks with no popularity (if available)
            if (track.popularity !== undefined && track.popularity < 10) {
                return false;
            }
            
            return true;
        });
    }

    // Ensure artist variety in final selection
    ensureArtistVariety(tracks) {
        const artistCount = {};
        const varietyTracks = [];
        const maxPerArtist = 2;
        
        // Shuffle first to randomize selection
        const shuffled = this.shuffleArray([...tracks]);
        
        for (const track of shuffled) {
            const artistName = track.artists[0]?.name;
            if (!artistName) continue;
            
            const currentCount = artistCount[artistName] || 0;
            if (currentCount < maxPerArtist) {
                varietyTracks.push(track);
                artistCount[artistName] = currentCount + 1;
            }
        }
        
        return varietyTracks;
    }

    // Enhanced weather search strategies
    getWeatherSearchStrategies(weatherMain) {
        const weather = weatherMain.toLowerCase();
        
        const strategies = {
            clear: {
                genres: ['pop', 'dance', 'indie-pop', 'electronic', 'funk', 'disco', 'house', 'reggae', 'tropical'],
                moods: ['happy', 'upbeat', 'energetic', 'positive', 'cheerful', 'euphoric', 'sunny', 'bright'],
                artists: ['Taylor Swift', 'Dua Lipa', 'Harry Styles', 'Ed Sheeran', 'Ariana Grande', 'Post Malone', 'Olivia Rodrigo', 'The Weeknd', 'Bruno Mars', 'Doja Cat'],
                keywords: ['summer', 'sunshine', 'feel good', 'party', 'dance', 'celebration', 'beach', 'vacation', 'good vibes', 'uplifting']
            },
            rain: {
                genres: ['indie', 'folk', 'acoustic', 'alternative', 'singer-songwriter', 'indie-folk', 'bedroom-pop', 'lo-fi'],
                moods: ['melancholy', 'contemplative', 'chill', 'cozy', 'introspective', 'nostalgic', 'dreamy', 'calm', 'peaceful'],
                artists: ['Bon Iver', 'Phoebe Bridgers', 'The National', 'Adele', 'Lana Del Rey', 'Radiohead', 'Sufjan Stevens', 'Cigarettes After Sex', 'Billie Eilish', 'Clairo'],
                keywords: ['rainy day', 'introspective', 'quiet', 'peaceful', 'reflection', 'cozy', 'melancholy', 'rain', 'gentle', 'soft']
            },
            drizzle: {
                genres: ['indie-folk', 'chill', 'ambient', 'soft-rock', 'lo-fi', 'dream-pop', 'chillwave', 'acoustic'],
                moods: ['gentle', 'mellow', 'soothing', 'calm', 'relaxed', 'soft', 'peaceful', 'tender'],
                artists: ['Lorde', 'Clairo', 'Rex Orange County', 'boy pablo', 'Mac DeMarco', 'Tame Impala', 'Beach House', 'Kali Uchis'],
                keywords: ['soft', 'gentle', 'dreamy', 'lo-fi', 'chill', 'mellow', 'relaxing', 'light rain', 'misty']
            },
            thunderstorm: {
                genres: ['rock', 'metal', 'electronic', 'alternative', 'punk', 'hard-rock', 'dubstep', 'heavy'],
                moods: ['intense', 'powerful', 'dramatic', 'energetic', 'explosive', 'electric', 'aggressive', 'bold'],
                artists: ['Imagine Dragons', 'Twenty One Pilots', 'Linkin Park', 'The Killers', 'Arctic Monkeys', 'Foo Fighters', 'Royal Blood', 'Muse'],
                keywords: ['powerful', 'intense', 'epic', 'storm', 'electric', 'thunder', 'dramatic', 'energy', 'bold']
            },
            snow: {
                genres: ['folk', 'ambient', 'classical', 'indie', 'acoustic', 'winter', 'neoclassical', 'piano'],
                moods: ['peaceful', 'serene', 'contemplative', 'cozy', 'quiet', 'magical', 'calm', 'wintry'],
                artists: ['Sufjan Stevens', 'Ólafur Arnalds', 'Agnes Obel', 'Bon Iver', 'Iron & Wine', 'Nils Frahm', 'Max Richter'],
                keywords: ['winter', 'peaceful', 'quiet', 'serene', 'cozy', 'snow', 'cold', 'magical', 'crystalline']
            },
            clouds: {
                genres: ['alternative', 'indie-rock', 'dream-pop', 'shoegaze', 'post-rock', 'brit-pop', 'indie'],
                moods: ['contemplative', 'atmospheric', 'mellow', 'thoughtful', 'dreamy', 'moody', 'reflective'],
                artists: ['The 1975', 'Arctic Monkeys', 'Vampire Weekend', 'Tame Impala', 'MGMT', 'Foster the People', 'Two Door Cinema Club'],
                keywords: ['atmospheric', 'dreamy', 'alternative', 'indie', 'cloudy', 'overcast', 'gray', 'moody']
            }
        };

        return strategies[weather] || strategies.clear;
    }

    // Utility methods
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

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // User profile methods (unchanged)
    async getUserProfile() {
        const accessToken = await this.getValidAccessToken();
        if (!accessToken) {
            throw new Error('Not authenticated with Spotify');
        }

        try {
            const response = await fetch(`${this.baseUrl}/me`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
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

    // Create playlist (unchanged)
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

    // Add tracks to playlist (unchanged)
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
        console.log(`🌤️ Fetching weather for coordinates: ${latitude}, ${longitude}`);
        
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${weather_API_KEY}&units=imperial`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Weather API error:', errorText);
            
            if (response.status === 401) {
                throw new Error('Weather API key invalid - please contact support');
            } else if (response.status === 404) {
                throw new Error('Weather data not available for your location');
            } else if (response.status === 429) {
                throw new Error('Weather service temporarily unavailable - please try again in a moment');
            } else {
                throw new Error(`Weather API error: ${response.status}`);
            }
        }
        
        const data = await response.json();
        console.log('✅ Weather API response received:', data);
        return data;
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw error;
    }
};