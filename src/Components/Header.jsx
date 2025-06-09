import { useState, useEffect } from "react";
import '../CSS/Header.css';
import { SpotifyAuth } from "../services/api";

function Header() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [spotifyAuth] = useState(new SpotifyAuth());
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        // Check if user is already logged in
        setIsLoggedIn(spotifyAuth.isLoggedIn());

        // Handle callback from Spotify (authorization code flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        if (error) {
            console.error('❌ Spotify authorization error:', error);
            setIsConnecting(false);
            return;
        }
        
        if (code) {
            console.log('🔑 Authorization code received, exchanging for token...');
            setIsConnecting(true);
            
            spotifyAuth.getAccessToken(code).then(() => {
                console.log('✅ Successfully authenticated with Spotify');
                setIsLoggedIn(true);
                setIsConnecting(false);
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }).catch(error => {
                console.error('❌ Authentication failed:', error);
                setIsConnecting(false);
            });
        }
    }, [spotifyAuth]);

    const handleLogin = async () => {
        try {
            setIsConnecting(true);
            console.log('🚀 Starting Spotify authorization...');
            await spotifyAuth.authorize();
        } catch (error) {
            console.error('❌ Failed to start authorization:', error);
            setIsConnecting(false);
        }
    };

    const handleLogout = () => {
        console.log('👋 Logging out from Spotify...');
        spotifyAuth.logout();
        setIsLoggedIn(false);
        setIsConnecting(false);
    };

    // Show connecting state
    if (isConnecting) {
        return (
            <div className="btn-container">
                <button className="btn-connecting" disabled>
                    Connecting to Spotify...
                </button>
            </div>
        );
    }

    return (
        <div className="btn-container">
            {isLoggedIn ? (
                <button onClick={handleLogout} className="btn-connected">
                    ✅ Connected to Spotify!
                </button>
            ) : (
                <button onClick={handleLogin} className="btn-disconnected">
                    🎵 Connect to Spotify
                </button>
            )}
        </div>
    );
}

export default Header;