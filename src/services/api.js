// Updated Spotify API for post-November 2024 restrictions with enhanced geographic support
const spotify_API_KEY = import.meta.env.VITE_SPOTIFY_API_KEY;
const spotify_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

export class SpotifyAuth {
    constructor() {
        this.clientId = `${spotify_API_KEY}`;
        this.clientSecret = `${spotify_CLIENT_SECRET}`;
        // Dynamic redirect URI based on current host
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

    // Detect user's likely market/region for better Spotify results
    detectUserMarket() {
        try {
            // Try to detect from browser language/locale
            const language = navigator.language || navigator.userLanguage || 'en-US';
            const locale = language.toLowerCase();
            
            // Map common locales to Spotify markets
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
                                 'US'; // Default fallback
            
            console.log(`🌍 Detected user market: ${detectedMarket} (from locale: ${locale})`);
            return detectedMarket;
        } catch (error) {
            console.warn('Could not detect user market, defaulting to US:', error);
            return 'US';
        }
    }

    // Get comprehensive market list based on user's detected region
    getMarketStrategy(userMarket = 'US') {
        // Prioritize user's region, then expand globally
        const globalMarkets = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'FI', 'BR', 'MX', 'JP'];
        
        // Put user's market first, then add others
        const markets = [userMarket];
        globalMarkets.forEach(market => {
            if (market !== userMarket && !markets.includes(market)) {
                markets.push(market);
            }
        });
        
        return markets;
    }

    // Client Credentials Flow - Limited to basic search only
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
            
            localStorage.setItem('client_access_token', data.access_token);
            localStorage.setItem('client_token_expires_at', Date.now() + (data.expires_in * 1000));
            
            console.log('✅ Client credentials token obtained');
            return data.access_token;
            
        } catch (error) {
            console.error('Client credentials error:', error);
            throw error;
        }
    }

    // Get valid client credentials token
    async getValidClientToken() {
        const accessToken = localStorage.getItem('client_access_token');
        const expiresAt = localStorage.getItem('client_token_expires_at');

        if (accessToken && expiresAt && Date.now() < parseInt(expiresAt)) {
            return accessToken;
        }

        return await this.getClientCredentialsToken();
    }

    // Start the authorization flow (for user features like playlists)
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

    // Get current valid access token (for user features)
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
        localStorage.removeItem('client_access_token');
        localStorage.removeItem('client_token_expires_at');
    }

    // ========== ENHANCED GEOGRAPHIC SEARCH ==========

    // Search tracks with geographic awareness
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
                
                // Check for specific geographic errors
                if (response.status === 400 && errorText.includes('market')) {
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
                    has_preview: !!track.preview_url,
                    search_market: market,
                    search_query: query,
                    available_markets: track.available_markets || []
                }));

        } catch (error) {
            console.error(`Error searching for "${query}" in ${market}:`, error);
            return [];
        }
    }

    // Enhanced weather-based search strategy with MORE variety
    getWeatherSearchStrategies(weatherMain) {
        const weather = weatherMain.toLowerCase();
        
        const strategies = {
            clear: {
                // Expanded genres for more variety
                genres: ['pop', 'dance', 'indie-pop', 'electronic', 'funk', 'disco', 'house', 'tropical-house', 'latin'],
                moods: ['happy', 'upbeat', 'energetic', 'positive', 'cheerful', 'euphoric', 'joyful'],
                artists: ['Taylor Swift', 'Dua Lipa', 'Harry Styles', 'Ed Sheeran', 'Ariana Grande', 'Post Malone', 'Olivia Rodrigo', 'The Weeknd'],
                keywords: ['summer', 'sunshine', 'feel good', 'party', 'dance', 'celebration', 'beach', 'vacation'],
                years: ['2020-2024', '2021-2024', '2022-2024', '2023-2024']
            },
            rain: {
                genres: ['indie', 'folk', 'acoustic', 'alternative', 'singer-songwriter', 'indie-folk', 'bedroom-pop'],
                moods: ['melancholy', 'contemplative', 'chill', 'cozy', 'introspective', 'nostalgic', 'dreamy'],
                artists: ['Bon Iver', 'Phoebe Bridgers', 'The National', 'Adele', 'Lana Del Rey', 'Radiohead', 'Sufjan Stevens', 'Cigarettes After Sex'],
                keywords: ['rainy day', 'introspective', 'quiet', 'peaceful', 'reflection', 'cozy', 'melancholy'],
                years: ['2020-2024', '2021-2024', '2022-2024']
            },
            drizzle: {
                genres: ['indie-folk', 'chill', 'ambient', 'soft-rock', 'lo-fi', 'dream-pop', 'chillwave'],
                moods: ['gentle', 'mellow', 'soothing', 'calm', 'relaxed', 'soft', 'peaceful'],
                artists: ['Lorde', 'Clairo', 'Rex Orange County', 'boy pablo', 'Mac DeMarco', 'Tame Impala', 'Beach House'],
                keywords: ['soft', 'gentle', 'dreamy', 'lo-fi', 'chill', 'mellow', 'relaxing'],
                years: ['2020-2024', '2021-2024', '2022-2024']
            },
            thunderstorm: {
                genres: ['rock', 'metal', 'electronic', 'alternative', 'punk', 'hard-rock', 'dubstep'],
                moods: ['intense', 'powerful', 'dramatic', 'energetic', 'explosive', 'electric', 'aggressive'],
                artists: ['Imagine Dragons', 'Twenty One Pilots', 'Linkin Park', 'The Killers', 'Arctic Monkeys', 'Foo Fighters', 'Royal Blood'],
                keywords: ['powerful', 'intense', 'epic', 'storm', 'electric', 'thunder', 'dramatic'],
                years: ['2020-2024', '2021-2024', '2022-2024']
            },
            snow: {
                genres: ['folk', 'ambient', 'classical', 'indie', 'acoustic', 'winter', 'neoclassical'],
                moods: ['peaceful', 'serene', 'contemplative', 'cozy', 'quiet', 'magical', 'calm'],
                artists: ['Sufjan Stevens', 'Ólafur Arnalds', 'Agnes Obel', 'Bon Iver', 'Iron & Wine', 'Nils Frahm'],
                keywords: ['winter', 'peaceful', 'quiet', 'serene', 'cozy', 'snow', 'cold'],
                years: ['2020-2024', '2021-2024', '2022-2024']
            },
            clouds: {
                genres: ['alternative', 'indie-rock', 'dream-pop', 'shoegaze', 'post-rock', 'brit-pop'],
                moods: ['contemplative', 'atmospheric', 'mellow', 'thoughtful', 'dreamy', 'moody'],
                artists: ['The 1975', 'Arctic Monkeys', 'Vampire Weekend', 'Tame Impala', 'MGMT', 'Foster the People'],
                keywords: ['atmospheric', 'dreamy', 'alternative', 'indie', 'cloudy', 'overcast'],
                years: ['2020-2024', '2021-2024', '2022-2024']
            },
            mist: {
                genres: ['ambient', 'electronic', 'dream-pop', 'shoegaze', 'ethereal', 'chillwave'],
                moods: ['ethereal', 'dreamy', 'atmospheric', 'mysterious', 'floating', 'surreal'],
                artists: ['Beach House', 'Slowdive', 'My Bloody Valentine', 'Mazzy Star', 'Cocteau Twins'],
                keywords: ['ethereal', 'dreamy', 'ambient', 'atmospheric', 'misty', 'floating'],
                years: ['2020-2024', '2021-2024', '2022-2024']
            },
            fog: {
                genres: ['ambient', 'post-rock', 'electronic', 'experimental', 'minimalist', 'drone'],
                moods: ['mysterious', 'atmospheric', 'minimalist', 'contemplative', 'obscure', 'enigmatic'],
                artists: ['Sigur Rós', 'Stars of the Lid', 'Tim Hecker', 'Brian Eno', 'Godspeed You! Black Emperor'],
                keywords: ['atmospheric', 'ambient', 'mysterious', 'minimalist', 'fog', 'obscured'],
                years: ['2020-2024', '2021-2024', '2022-2024']
            }
        };

        return strategies[weather] || strategies.clear;
    }

    // AGGRESSIVE recommendation method to ensure full track count
    async getRecommendations(weatherMain, limit = 25) {
        console.log('=== AGGRESSIVE PLAYLIST GENERATION ===');
        console.log(`🌍 Weather: ${weatherMain}, Target: ${limit} tracks`);
        
        try {
            let allTracks = [];
            const strategy = this.getWeatherSearchStrategies(weatherMain);
            
            // Detect user's market and build strategy
            const userMarket = this.detectUserMarket();
            const marketList = this.getMarketStrategy(userMarket);
            
            console.log(`🎯 User market detected: ${userMarket}`);
            console.log(`🌐 Market search order: ${marketList.slice(0, 4).join(', ')}`);
            
            // PHASE 1: Main search queries (Get bulk of tracks)
            const mainQueries = [
                // High-yield genre searches
                `genre:${strategy.genres[0]}`,
                `genre:${strategy.genres[1]}`,
                strategy.genres[2] || strategy.genres[0], // Direct genre search
                
                // Popular artists
                strategy.artists[0],
                strategy.artists[1],
                strategy.artists[2] || strategy.artists[0],
                
                // Mood-based searches
                `${strategy.moods[0]} music`,
                `${strategy.moods[1]} songs`,
                
                // Keyword searches
                strategy.keywords[0],
                strategy.keywords[1] || strategy.keywords[0],
                
                // Year-based searches for freshness
                `year:2023-2024`,
                `year:2022-2024`,
                
                // Fallback popular searches
                'popular music',
                'top hits',
                'trending'
            ];
            
            console.log(`🚀 Starting aggressive search with ${mainQueries.length} queries...`);
            
            // Execute main searches aggressively
            for (let i = 0; i < mainQueries.length && allTracks.length < limit * 2; i++) {
                const query = mainQueries[i];
                
                // Try primary market first (more results per call)
                try {
                    console.log(`🔍 Main Query ${i+1}/${mainQueries.length}: "${query}" in ${userMarket}`);
                    const results = await this.searchTracks(query, 30, userMarket); // Get 30 per call
                    
                    if (results.length > 0) {
                        allTracks.push(...results);
                        console.log(`✅ Added ${results.length} tracks from ${userMarket} (Total: ${allTracks.length})`);
                    } else if (i < 5) { // Try backup market for first 5 queries only
                        console.log(`🔄 Trying backup market for critical query`);
                        const backupResults = await this.searchTracks(query, 30, 'US');
                        if (backupResults.length > 0) {
                            allTracks.push(...backupResults);
                            console.log(`✅ Added ${backupResults.length} tracks from US backup`);
                        }
                    }
                    
                    // Quick delay to avoid overwhelming API
                    await new Promise(resolve => setTimeout(resolve, 250));
                    
                } catch (error) {
                    console.error(`Failed main query "${query}":`, error);
                    continue;
                }
                
                // Early exit if we have enough
                if (allTracks.length >= limit * 1.5) {
                    console.log(`🎯 Early exit: Got ${allTracks.length} tracks, more than target`);
                    break;
                }
            }
            
            // PHASE 2: Fill-up searches if still short
            if (allTracks.length < limit) {
                console.log(`🔄 Phase 2: Need ${limit - allTracks.length} more tracks, running fill-up searches...`);
                
                const fillUpQueries = [
                    'hits 2024',
                    'popular songs',
                    'chart music',
                    'best music',
                    'new music',
                    'trending songs'
                ];
                
                for (const query of fillUpQueries) {
                    if (allTracks.length >= limit * 1.2) break;
                    
                    try {
                        const results = await this.searchTracks(query, 25, userMarket);
                        if (results.length > 0) {
                            allTracks.push(...results);
                            console.log(`✅ Fill-up: Added ${results.length} tracks (Total: ${allTracks.length})`);
                        }
                        await new Promise(resolve => setTimeout(resolve, 200));
                    } catch (error) {
                        console.error(`Fill-up query failed:`, error);
                        continue;
                    }
                }
            }

            if (allTracks.length === 0) {
                throw new Error('Unable to generate playlist. This may be due to Spotify API restrictions in your region. Please try again.');
            }

            // Process and return final tracks
            const uniqueTracks = this.removeDuplicates(allTracks);
            console.log(`🧹 After deduplication: ${uniqueTracks.length} unique tracks`);
            
            const shuffledTracks = this.shuffleArray(uniqueTracks);
            const finalTracks = shuffledTracks.slice(0, limit);

            console.log(`🎉 FINAL SUCCESS: Generated ${finalTracks.length} tracks out of ${limit} requested`);
            console.log(`📈 Success rate: ${Math.round((finalTracks.length / limit) * 100)}%`);
            console.log(`🌍 Markets used: ${[...new Set(finalTracks.map(t => t.search_market))].join(', ')}`);
            
            return finalTracks;

        } catch (error) {
            console.error('💥 Aggressive playlist generation failed:', error);
            throw error;
        }
    }

    // Enhanced duplicate removal
    removeDuplicates(tracks) {
        const seen = new Set();
        const seenCombos = new Set();
        
        return tracks.filter(track => {
            if (!track || !track.id) return false;
            
            // Check by Spotify ID
            if (seen.has(track.id)) return false;
            seen.add(track.id);
            
            // Check by artist + title combination
            const combo = `${track.artists[0]?.name?.toLowerCase()}-${track.name?.toLowerCase()}`;
            if (seenCombos.has(combo)) return false;
            seenCombos.add(combo);
            
            return true;
        });
    }

    // Shuffle array utility
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // User profile (requires user auth) - UNCHANGED
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

    // Create playlist (requires user auth) - UNCHANGED
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

    // Add tracks to playlist (requires user auth) - UNCHANGED
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

// Enhanced Weather API with better geographic error handling
const weather_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

export const getWeather = async (latitude, longitude) => {
    try {
        console.log(`🌤️ Fetching weather for coordinates: ${latitude}, ${longitude}`);
        
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${weather_API_KEY}&units=imperial`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Weather API error:', errorText);
            
            // Provide more specific error messages for geographic issues
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