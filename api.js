// Spotify API
const spotify_API_KEY = import.meta.env.VITE_SPOTIFY_API_KEY;

// Spotify Authentication 
export class SpotifyAuth {
    constructor() {
        this.clientId = `${spotify_API_KEY}`;
        this.redirectUri = 'https://weatherbeatz.netlify.app/'
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

    // Get weather-based parameters for Spotify recommendations
    // Using ONLY valid Spotify genre seeds
    getWeatherBasedParams(weatherMain) {
        const weather = weatherMain.toLowerCase();
        
        switch (weather) {
            case 'clear':
            case 'sunny':
                return {
                    genres: ['pop', 'indie-pop', 'summer', 'happy', 'dance'],
                    target_energy: 0.8,
                    target_valence: 0.9,
                    target_danceability: 0.7,
                    target_tempo: 120,
                    mood: { mood: 'happy' }
                };
            
            case 'rain':
            case 'drizzle':
                return {
                    genres: ['indie', 'alternative', 'chill', 'ambient', 'singer-songwriter'],
                    target_energy: 0.4,
                    target_valence: 0.3,
                    target_danceability: 0.3,
                    target_tempo: 80,
                    mood: { mood: 'melancholic' }
                };
            
            case 'thunderstorm':
            case 'storm':
                return {
                    genres: ['rock', 'metal', 'alternative', 'grunge', 'punk'],
                    target_energy: 0.9,
                    target_valence: 0.5,
                    target_danceability: 0.5,
                    target_tempo: 140,
                    mood: { mood: 'intense' }
                };
            
            case 'snow':
                return {
                    genres: ['ambient', 'classical', 'folk', 'acoustic', 'chill'],
                    target_energy: 0.3,
                    target_valence: 0.5,
                    target_danceability: 0.2,
                    target_tempo: 70,
                    mood: { mood: 'peaceful' }
                };
            
            case 'clouds':
            case 'overcast':
                return {
                    genres: ['indie', 'alternative', 'folk', 'singer-songwriter', 'indie-pop'],
                    target_energy: 0.5,
                    target_valence: 0.4,
                    target_danceability: 0.4,
                    target_tempo: 100,
                    mood: { mood: 'calm' }
                };
            
            case 'mist':
            case 'fog':
                return {
                    genres: ['ambient', 'electronic', 'chill', 'new-age', 'trip-hop'],
                    target_energy: 0.4,
                    target_valence: 0.4,
                    target_danceability: 0.3,
                    target_tempo: 90,
                    mood: { mood: 'mysterious' }
                };
            
            default:
                return {
                    genres: ['pop', 'indie', 'alternative', 'rock', 'electronic'],
                    target_energy: 0.6,
                    target_valence: 0.6,
                    target_danceability: 0.5,
                    target_tempo: 110,
                    mood: { mood: 'calm' }
                };
        }
    }

    // Remove duplicate tracks helper - LOOSE version (only removes exact same track+artist)
    removeDuplicateTracksLoose(tracks) {
        const seen = new Set();
        return tracks.filter(track => {
            // Only check for exact track name and first artist match
            const key = `${track.name.toLowerCase().trim()}-${track.artists[0].name.toLowerCase().trim()}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // Less aggressive mood filtering - keeps more tracks
    filterTracksByWeatherMoodLoose(tracks, mood) {
        // If we have fewer tracks than needed, don't filter by mood at all
        if (tracks.length < 30) {
            return tracks;
        }

        const moodKeywords = {
            happy: ['happy', 'joy', 'sun', 'bright', 'dance', 'party', 'celebration', 'good', 'love', 'up', 'high', 'fun'],
            calm: ['calm', 'peaceful', 'relax', 'soft', 'gentle', 'quiet', 'slow', 'acoustic', 'chill', 'easy'],
            melancholic: ['rain', 'sad', 'blue', 'lonely', 'tears', 'goodbye', 'memories', 'lost', 'hurt', 'pain'],
            intense: ['storm', 'thunder', 'power', 'strong', 'wild', 'fire', 'energy', 'rock', 'hard', 'loud'],
            peaceful: ['snow', 'winter', 'cold', 'silent', 'white', 'calm', 'still', 'peaceful', 'quiet', 'gentle'],
            mysterious: ['dark', 'mystery', 'shadow', 'night', 'deep', 'unknown', 'secret', 'hidden']
        };

        const keywords = moodKeywords[mood.mood] || [];
        
        if (keywords.length === 0) {
            return tracks;
        }

        // Score tracks but keep all of them, just reorder by relevance
        const scoredTracks = tracks.map(track => {
            let score = 0;
            const searchText = `${track.name} ${track.artists.map(a => a.name).join(' ')} ${track.album.name}`.toLowerCase();
            
            keywords.forEach(keyword => {
                if (searchText.includes(keyword)) {
                    score += 1;
                }
            });

            return { track, score };
        });

        // Sort by score but return ALL tracks, just prioritizing matches
        scoredTracks.sort((a, b) => b.score - a.score);
        return scoredTracks.map(item => item.track);
    }

    // Get broader search results using genres
    async getBroaderSearchResults(accessToken, genres, needed) {
        console.log(`Getting ${needed} additional tracks using genre searches`);
        let additionalTracks = [];
        
        // Search by genre names directly
        for (const genre of genres.slice(0, 3)) {
            if (additionalTracks.length >= needed) break;
            
            try {
                console.log(`Broad search for genre: ${genre}`);
                const genreResults = await this.searchTracks(accessToken, genre, Math.ceil(needed / 3));
                additionalTracks.push(...genreResults);
            } catch (error) {
                console.log(`Genre search failed for ${genre}:`, error.message);
            }
        }
        
        // If still need more, do very broad searches
        if (additionalTracks.length < needed) {
            const broadTerms = ['popular', 'hits', 'top songs', 'music'];
            for (const term of broadTerms) {
                if (additionalTracks.length >= needed) break;
                
                try {
                    console.log(`Very broad search for: ${term}`);
                    const broadResults = await this.searchTracks(accessToken, term, 10);
                    additionalTracks.push(...broadResults);
                } catch (error) {
                    console.log(`Broad search failed for ${term}:`, error.message);
                }
            }
        }
        
        console.log(`Got ${additionalTracks.length} additional tracks from broader searches`);
        return additionalTracks;
    }

    // Test if recommendations endpoint is accessible
    async testRecommendationsEndpoint(accessToken) {
        const params = new URLSearchParams({
            seed_genres: 'pop',
            limit: 1,
            market: 'US'
        });

        const response = await fetch(`${this.baseUrl}/recommendations?${params}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Recommendations endpoint test failed: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    // Main method with fallback strategy
    async getRecommendations(weatherMain, limit = 25) {
        console.log('=== SPOTIFY PLAYLIST GENERATION ===');
        console.log('Weather:', weatherMain, 'Limit:', limit);
        
        try {
            const accessToken = await this.getValidAccessToken();
            if (!accessToken) {
                throw new Error('Not authenticated with Spotify');
            }

            console.log('✓ Access token obtained');

            // First, try the recommendations API
            try {
                await this.testRecommendationsEndpoint(accessToken);
                console.log('✓ Recommendations endpoint is accessible, using recommendations API');
                return await this.getRecommendationsFromAPI(weatherMain, limit, accessToken);
            } catch (error) {
                console.log('✗ Recommendations API not available:', error.message);
                console.log('Falling back to search-based method...');
                return await this.getWeatherPlaylistBySearch(weatherMain, limit);
            }

        } catch (error) {
            console.error('=== ERROR in getRecommendations ===');
            console.error('Error message:', error.message);
            throw error;
        }
    }

    // Original recommendations API method
    async getRecommendationsFromAPI(weatherMain, limit, accessToken) {
        // Define weather-based parameters
        const weatherParams = this.getWeatherBasedParams(weatherMain);
        console.log('Weather parameters:', weatherParams);

        let allRecommendations = [];

        // Method 1: Pure genre-based recommendations (70% of results)
        if (weatherParams.genres && weatherParams.genres.length > 0) {
            try {
                console.log('Fetching recommendations with ONLY genre seeds...');
                const genreRecommendations = await this.getRecommendationsWithGenresOnly(accessToken, weatherParams, Math.ceil(limit * 0.7));
                allRecommendations.push(...genreRecommendations);
                console.log(`✓ Got ${genreRecommendations.length} pure genre-based recommendations`);
            } catch (error) {
                console.log('✗ Genre recommendations failed:', error.message);
            }
        }

        // Method 2: Track seed recommendations (30% of results) - using popular tracks as seeds
        try {
            console.log('Fetching recommendations with track seeds...');
            const trackRecommendations = await this.getRecommendationsWithTracks(accessToken, weatherParams, Math.ceil(limit * 0.3));
            allRecommendations.push(...trackRecommendations);
            console.log(`✓ Got ${trackRecommendations.length} track-based recommendations`);
        } catch (error) {
            console.log('✗ Track recommendations failed:', error.message);
        }

        // Fallback: If we don't have enough recommendations, get more genre-based ones
        if (allRecommendations.length < limit / 2) {
            try {
                console.log('Getting additional genre recommendations as fallback...');
                const additionalRecs = await this.getRecommendationsWithGenresOnly(accessToken, weatherParams, limit - allRecommendations.length);
                allRecommendations.push(...additionalRecs);
            } catch (error) {
                console.log('✗ Fallback recommendations failed:', error.message);
            }
        }

        // Remove duplicates
        const uniqueRecommendations = this.removeDuplicateTracks(allRecommendations);
        console.log(`Final recommendations after deduplication: ${uniqueRecommendations.length}`);

        if (uniqueRecommendations.length === 0) {
            throw new Error('No recommendations found. Please try again or check your Spotify connection.');
        }

        // Shuffle and limit
        const shuffled = this.shuffleArray(uniqueRecommendations);
        const finalTracks = shuffled.slice(0, Math.min(limit, shuffled.length));

        console.log('Final track count:', finalTracks.length);
        console.log('Sample tracks:', finalTracks.slice(0, 3).map(t => `${t.name} by ${t.artists[0].name}`));

        return finalTracks;
    }

    // Get recommendations using ONLY genre seeds (no user data)
    async getRecommendationsWithGenresOnly(accessToken, weatherParams, limit) {
        const genres = weatherParams.genres.slice(0, 5); // Max 5 genre seeds
        const genreString = genres.join(',');
        
        const params = new URLSearchParams({
            seed_genres: genreString,
            limit: Math.min(limit, 100), // Spotify max is 100
            target_energy: weatherParams.target_energy,
            target_valence: weatherParams.target_valence,
            target_danceability: weatherParams.target_danceability,
            target_tempo: weatherParams.target_tempo,
            min_popularity: 30, // Slightly higher to ensure quality
            max_popularity: 85, // Avoid the most mainstream tracks
            market: 'US'
        });

        const response = await fetch(`${this.baseUrl}/recommendations?${params}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Genre recommendations failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.tracks || [];
    }

    // Get recommendations using popular track seeds (not user's tracks)
    async getRecommendationsWithTracks(accessToken, weatherParams, limit) {
        // Get popular tracks from a genre playlist or use featured playlists
        const seedTracks = await this.getPopularSeedTracks(accessToken, weatherParams.genres[0]);
        
        if (seedTracks.length === 0) {
            throw new Error('No seed tracks found');
        }

        // Use up to 5 tracks as seeds
        const trackIds = seedTracks.slice(0, 5).map(track => track.id).join(',');

        const params = new URLSearchParams({
            seed_tracks: trackIds,
            limit: Math.min(limit, 100),
            target_energy: weatherParams.target_energy,
            target_valence: weatherParams.target_valence,
            target_danceability: weatherParams.target_danceability,
            target_tempo: weatherParams.target_tempo,
            min_popularity: 20,
            max_popularity: 80,
            market: 'US'
        });

        const response = await fetch(`${this.baseUrl}/recommendations?${params}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Track recommendations failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.tracks || [];
    }

    // Get popular seed tracks from genre-based playlists (not user playlists)
    async getPopularSeedTracks(accessToken, primaryGenre) {
        try {
            // Search for popular playlists of the genre
            const searchQuery = `genre:${primaryGenre}`;
            const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(searchQuery)}&type=playlist&limit=5&market=US`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                return [];
            }

            const data = await response.json();
            
            if (!data.playlists || !data.playlists.items || data.playlists.items.length === 0) {
                return [];
            }

            // Get tracks from the first playlist
            const playlistId = data.playlists.items[0].id;
            const tracksResponse = await fetch(`${this.baseUrl}/playlists/${playlistId}/tracks?limit=20&market=US`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!tracksResponse.ok) {
                return [];
            }

            const tracksData = await tracksResponse.json();
            return tracksData.items
                .filter(item => item.track && item.track.id)
                .map(item => item.track)
                .slice(0, 10);

        } catch (error) {
            console.log('Error getting seed tracks:', error);
            return [];
        }
    }

    // Alternative method: Search-based playlist generation (no recommendations API needed)
    async getWeatherPlaylistBySearch(weatherMain, limit = 25) {
        console.log('=== SEARCH-BASED PLAYLIST GENERATION ===');
        console.log('Weather:', weatherMain, 'Limit:', limit);
        
        try {
            const accessToken = await this.getValidAccessToken();
            if (!accessToken) {
                throw new Error('Not authenticated with Spotify');
            }

            const weatherParams = this.getWeatherBasedParams(weatherMain);
            let searchQueries = this.getWeatherSearchQueries(weatherMain);
            
            // Limit search queries based on playlist size to avoid API rate limits
            const maxQueries = Math.min(searchQueries.length, Math.ceil(limit / 3));
            searchQueries = searchQueries.slice(0, maxQueries);
            
            let allTracks = [];

            // Calculate how many tracks to get per search - be more aggressive
            const tracksPerSearch = Math.max(15, Math.ceil(limit * 2.5 / searchQueries.length));
            console.log(`Getting ${tracksPerSearch} tracks per search from ${searchQueries.length} queries`);

            // Search for tracks using weather-related terms
            for (const query of searchQueries) {
                try {
                    console.log(`Searching for: "${query}" (requesting ${tracksPerSearch} tracks)`);
                    const searchResults = await this.searchTracks(accessToken, query, tracksPerSearch);
                    console.log(`Got ${searchResults.length} results for "${query}"`);
                    allTracks.push(...searchResults);
                } catch (error) {
                    console.log(`Search failed for "${query}":`, error.message);
                }
            }

            console.log(`Total tracks found before filtering: ${allTracks.length}`);

            // Less aggressive duplicate removal - only remove exact matches
            const uniqueTracks = this.removeDuplicateTracksLoose(allTracks);
            console.log(`Tracks after loose duplicate removal: ${uniqueTracks.length}`);

            // Filter tracks based on weather mood (but keep more tracks)
            const filteredTracks = this.filterTracksByWeatherMoodLoose(uniqueTracks, weatherParams.mood);
            console.log(`Tracks after mood filtering: ${filteredTracks.length}`);
            
            const shuffledTracks = this.shuffleArray(filteredTracks);
            
            // If we still don't have enough, do additional broad searches
            if (shuffledTracks.length < limit && shuffledTracks.length > 0) {
                console.log(`Need more tracks, doing broader search...`);
                const additionalTracks = await this.getBroaderSearchResults(accessToken, weatherParams.genres, limit - shuffledTracks.length);
                shuffledTracks.push(...additionalTracks);
            }
            
            // Final duplicate removal with the combined results
            const finalUniqueTracks = this.removeDuplicateTracksLoose(shuffledTracks);
            
            // Limit to requested amount
            const finalTracks = finalUniqueTracks.slice(0, Math.min(limit, finalUniqueTracks.length));
            
            console.log(`Final playlist: ${finalTracks.length} tracks (requested: ${limit})`);
            
            if (finalTracks.length < limit) {
                console.warn(`Warning: Only found ${finalTracks.length} tracks, but ${limit} were requested.`);
            }
            
            return finalTracks;

        } catch (error) {
            console.error('Search-based playlist generation failed:', error);
            throw error;
        }
    }

    // Get search queries based on weather - EXPANDED for more results
    getWeatherSearchQueries(weatherMain) {
        const weather = weatherMain.toLowerCase();
        
        switch (weather) {
            case 'clear':
            case 'sunny':
                return [
                    'sunny day', 'sunshine', 'summer vibes', 'good mood', 'happy songs',
                    'upbeat', 'feel good', 'bright', 'cheerful', 'positive',
                    'summer hits', 'pop music', 'dance music', 'party songs'
                ];
            case 'rain':
            case 'drizzle':
                return [
                    'rainy day', 'melancholy', 'sad songs', 'acoustic rain', 'indie chill',
                    'contemplative', 'introspective', 'mellow', 'soft rock', 'alternative',
                    'singer songwriter', 'indie folk', 'acoustic', 'emotional'
                ];
            case 'thunderstorm':
            case 'storm':
                return [
                    'storm', 'intense music', 'rock energy', 'powerful', 'electric',
                    'hard rock', 'metal', 'grunge', 'alternative rock', 'punk',
                    'energetic', 'driving', 'aggressive', 'loud'
                ];
            case 'snow':
                return [
                    'winter', 'peaceful', 'calm', 'acoustic', 'quiet songs',
                    'classical', 'ambient', 'chill', 'relaxing', 'serene',
                    'folk', 'instrumental', 'new age', 'meditation'
                ];
            case 'clouds':
            case 'overcast':
                return [
                    'cloudy', 'mellow', 'indie folk', 'contemplative', 'soft rock',
                    'alternative', 'indie', 'thoughtful', 'moderate', 'balanced',
                    'singer songwriter', 'folk rock', 'indie pop'
                ];
            case 'mist':
            case 'fog':
                return [
                    'ambient', 'mysterious', 'electronic chill', 'atmospheric', 'dreamy',
                    'ethereal', 'trip hop', 'downtempo', 'chillout', 'electronic',
                    'experimental', 'new age', 'shoegaze'
                ];
            default:
                return [
                    'chill', 'good vibes', 'popular', 'indie', 'alternative',
                    'pop music', 'rock', 'feel good', 'upbeat', 'mellow',
                    'contemporary', 'modern', 'trending', 'hits'
                ];
        }
    }

    // Search for tracks
    async searchTracks(accessToken, query, limit = 10) {
        const params = new URLSearchParams({
            q: query,
            type: 'track',
            limit: Math.min(limit, 50),
            market: 'US'
        });

        const response = await fetch(`${this.baseUrl}/search?${params}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Search failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.tracks?.items || [];
    }

    // Alternative method: Get recommendations with more diverse parameters
    async getDiscoveryRecommendations(weatherMain, limit = 25) {
        console.log('=== DISCOVERY MODE RECOMMENDATIONS ===');
        
        try {
            const accessToken = await this.getValidAccessToken();
            const weatherParams = this.getWeatherBasedParams(weatherMain);
            
            // Use wider parameter ranges for more discovery
            const discoveryParams = {
                ...weatherParams,
                min_popularity: 10,  // Allow less popular tracks
                max_popularity: 70,  // Avoid the most mainstream
                target_acousticness: weatherParams.target_energy < 0.5 ? 0.7 : 0.3,
                target_instrumentalness: weatherMain.toLowerCase() === 'snow' ? 0.6 : 0.1
            };

            const genres = discoveryParams.genres.slice(0, 3); // Use fewer genres for more variety
            const genreString = genres.join(',');
            
            const params = new URLSearchParams({
                seed_genres: genreString,
                limit: Math.min(limit, 100),
                target_energy: discoveryParams.target_energy,
                target_valence: discoveryParams.target_valence,
                target_danceability: discoveryParams.target_danceability,
                target_tempo: discoveryParams.target_tempo,
                target_acousticness: discoveryParams.target_acousticness,
                target_instrumentalness: discoveryParams.target_instrumentalness,
                min_popularity: discoveryParams.min_popularity,
                max_popularity: discoveryParams.max_popularity,
                market: 'US'
            });

            const response = await fetch(`${this.baseUrl}/recommendations?${params}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Discovery recommendations failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const tracks = data.tracks || [];
            
            console.log('Discovery recommendations:', tracks.length);
            return this.shuffleArray(tracks);

        } catch (error) {
            console.error('Discovery recommendations error:', error);
            throw error;
        }
    }

    // Helper function to filter tracks based on weather mood
    filterTracksByWeatherMood(tracks, mood) {
        const moodKeywords = {
            happy: ['happy', 'joy', 'sun', 'bright', 'dance', 'party', 'celebration', 'good', 'love', 'up', 'high', 'fun'],
            calm: ['calm', 'peaceful', 'relax', 'soft', 'gentle', 'quiet', 'slow', 'acoustic', 'chill', 'easy'],
            melancholic: ['rain', 'sad', 'blue', 'lonely', 'tears', 'goodbye', 'memories', 'lost', 'hurt', 'pain'],
            intense: ['storm', 'thunder', 'power', 'strong', 'wild', 'fire', 'energy', 'rock', 'hard', 'loud'],
            peaceful: ['snow', 'winter', 'cold', 'silent', 'white', 'calm', 'still', 'peaceful', 'quiet', 'gentle'],
            ambient: ['mist', 'fog', 'dream', 'ambient', 'atmospheric', 'space', 'ethereal', 'floating', 'cosmic'],
            mysterious: ['smoke', 'dark', 'mystery', 'shadow', 'night', 'deep', 'unknown', 'secret', 'hidden'],
            dreamy: ['haze', 'dream', 'soft', 'float', 'cloud', 'gentle', 'light', 'airy', 'drift'],
            earthy: ['dust', 'earth', 'ground', 'country', 'folk', 'natural', 'raw', 'organic', 'roots'],
            somber: ['ash', 'grey', 'heavy', 'serious', 'deep', 'contemplative', 'thoughtful', 'slow'],
            chaotic: ['tornado', 'chaos', 'wild', 'crazy', 'intense', 'fast', 'extreme', 'mad', 'insane']
        };

        const keywords = moodKeywords[mood.mood] || [];
        
        if (keywords.length === 0) {
            return tracks;
        }

        // Score tracks based on keyword matches
        const scoredTracks = tracks.map(track => {
            let score = 0;
            const searchText = `${track.name} ${track.artists.map(a => a.name).join(' ')} ${track.album.name}`.toLowerCase();
            
            keywords.forEach(keyword => {
                if (searchText.includes(keyword)) {
                    score += 1;
                }
            });

            return { track, score };
        });

        // Sort by score
        scoredTracks.sort((a, b) => b.score - a.score);
        
        // Return tracks with scores > 0, or all tracks if no matches
        const matchingTracks = scoredTracks.filter(item => item.score > 0);
        return matchingTracks.length > 0 
            ? matchingTracks.map(item => item.track)
            : tracks;
    }

    // Helper function to shuffle array
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
                    console.log('User followers:', data.followers.total);
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

    // Get user profile
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

    // Create a playlist
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

    // Add tracks to playlist
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

// Open Weather Map
const weather_API_KEY = import.meta.env.VITE_WEATHER_API_KEY; // Add your OpenWeatherMap API key

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