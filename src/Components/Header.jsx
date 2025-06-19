/**
 * Header Component - Spotify Authentication Management
 * 
 * This component handles the Spotify OAuth 2.0 authentication flow and displays
 * the current connection status to users. It manages the complete authentication
 * lifecycle from initial login through token management.
 * 
 * Key Features:
 * - OAuth 2.0 with PKCE authentication flow
 * - Visual connection status indicators
 * - Automatic callback handling after Spotify authorization
 * - Error handling for authentication failures
 * - Session persistence across page reloads
 * 
 * Authentication Flow:
 * 1. User clicks "Connect to Spotify" button
 * 2. Redirected to Spotify authorization page
 * 3. User grants permissions and returns to app
 * 4. Component exchanges authorization code for access token
 * 5. Tokens are stored for future API calls
 * 
 */

import { useState, useEffect } from "react";
import '../CSS/Header.css';
import { SpotifyAuth } from "../services/api";

function Header() {
    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================
    
    /**
     * Tracks whether user is currently authenticated with Spotify
     * Used to display appropriate button text and styling
     */
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    /**
     * Spotify authentication service instance
     * Handles all OAuth operations and token management
     * Created once and reused throughout component lifecycle
     */
    const [spotifyAuth] = useState(new SpotifyAuth());
    
    /**
     * Tracks active authentication process
     * Prevents multiple simultaneous auth attempts and shows loading state
     */
    const [isConnecting, setIsConnecting] = useState(false);

    // ========================================================================
    // AUTHENTICATION STATE INITIALIZATION & CALLBACK HANDLING
    // ========================================================================
    
    /**
     * Initialize authentication state and handle OAuth callbacks
     * This effect runs once on component mount to:
     * 1. Check if user is already logged in (from previous session)
     * 2. Handle OAuth callback from Spotify authorization page
     * 3. Exchange authorization code for access tokens
     * 4. Clean up URL parameters after successful authentication
     */
    useEffect(() => {
        // Check if user is already logged in from previous session
        setIsLoggedIn(spotifyAuth.isLoggedIn());

        // Handle OAuth callback from Spotify authorization page
        // When user grants permission, Spotify redirects back with URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');        // Authorization code for token exchange
        const error = urlParams.get('error');      // Error if user denied permission
        
        // Handle authorization errors (user denied permission, etc.)
        if (error) {
            console.error('❌ Spotify authorization error:', error);
            setIsConnecting(false);
            return;
        }
        
        // Process successful authorization callback
        if (code) {
            console.log('🔑 Authorization code received, exchanging for token...');
            setIsConnecting(true);
            
            // Exchange authorization code for access token
            spotifyAuth.getAccessToken(code).then(() => {
                console.log('✅ Successfully authenticated with Spotify');
                setIsLoggedIn(true);
                setIsConnecting(false);
                // Clean up URL parameters to prevent reprocessing on refresh
                window.history.replaceState({}, document.title, window.location.pathname);
            }).catch(error => {
                console.error('❌ Authentication failed:', error);
                setIsConnecting(false);
            });
        }
    }, [spotifyAuth]);

    // ========================================================================
    // AUTHENTICATION EVENT HANDLERS
    // ========================================================================
    
    /**
     * Initiate Spotify OAuth login process
     * Redirects user to Spotify authorization page where they can grant permissions
     * Sets connecting state to show loading indicator during redirect
     */
    const handleLogin = async () => {
        try {
            setIsConnecting(true);
            console.log('🚀 Starting Spotify authorization...');
            // This will redirect the page to Spotify's authorization server
            await spotifyAuth.authorize();
        } catch (error) {
            console.error('❌ Failed to start authorization:', error);
            setIsConnecting(false);
        }
    };

    /**
     * Log out user and clear all authentication tokens
     * Resets component state and clears stored tokens from memory/localStorage
     */
    const handleLogout = () => {
        console.log('👋 Logging out from Spotify...');
        spotifyAuth.logout();
        setIsLoggedIn(false);
        setIsConnecting(false);
    };

    // ========================================================================
    // RENDER LOGIC - DIFFERENT STATES
    // ========================================================================
    
    /**
     * Show connecting state during authentication process
     * Displays loading indicator and prevents additional clicks
     */
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

    /**
     * Main render - shows appropriate button based on authentication status
     * 
     * Two states:
     * 1. Connected: Green button with logout functionality
     * 2. Disconnected: Dark button with login functionality
     * 
     * Button styling changes based on state to provide clear visual feedback
     */
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