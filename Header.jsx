import { useState, useEffect } from "react";
import '../CSS/Header.css';
import { SpotifyAuth } from "../services/api";

function Header() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [spotifyAuth] = useState(new SpotifyAuth());

    useEffect(() => {
        // Check if user is already logged in
        setIsLoggedIn(spotifyAuth.isLoggedIn());

        // Handle callback from Spotify (for implicit grant)
        if (window.location.hash.includes('access_token')) {
            try {
                const success = spotifyAuth.handleCallback();
                if (success) {
                    setIsLoggedIn(true);
                }
            } catch (error) {
                console.error('Authentication failed:', error);
            }
        }

        // Handle callback from Spotify (for authorization code flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            spotifyAuth.getAccessToken(code).then(() => {
                setIsLoggedIn(true);
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }).catch(error => {
                console.error('Authentication failed:', error);
            });
        }
    }, [spotifyAuth]);

    const handleLogin = () => {
        spotifyAuth.authorize();
    };

    const handleLogout = () => {
        spotifyAuth.logout();
        setIsLoggedIn(false);
    };

    return (
        <div className="btn-container">
            {isLoggedIn ? (
                <button onClick={handleLogout} className="btn-connected">
                    Connected to Spotify!
                </button>
            ) : (
                <button onClick={handleLogin} className="btn-disconnected">
                    Connect to Spotify
                </button>
            )}
        </div>
    );
}

export default Header