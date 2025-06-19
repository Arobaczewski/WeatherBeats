/**
 * Settings Component - User Preferences for Playlist Generation
 * 
 * This component provides users with controls to customize their playlist generation
 * experience. It manages user preferences that directly influence the music
 * recommendation algorithm and content filtering.
 * 
 * Key Features:
 * - Playlist length selection (10, 20, or 30 tracks)
 * - Explicit content toggle for family-friendly filtering
 * - Real-time settings updates with immediate effect
 * - Accessible form controls with proper labeling
 * - Custom toggle switch with smooth animations
 * 
 * State Management:
 * Uses "lift state up" pattern - settings are managed in parent component
 * and passed down as props, with change handlers lifting updates back up.
 * This ensures playlist generation always uses current user preferences.
 * 
 * @author Your Name
 * @version 1.0.0
 */

import '../CSS/Settings.css';

function Settings({ settings, onSettingsChange }) {
    // ========================================================================
    // EVENT HANDLERS - USER PREFERENCE UPDATES
    // ========================================================================

    /**
     * Handle playlist length selection changes
     * Updates user preference for number of tracks to generate
     * 
     * Available options:
     * - 10 tracks: Quick playlist for short listening sessions
     * - 20 tracks: Standard playlist for medium sessions
     * - 30 tracks: Extended playlist for long listening sessions
     * 
     * @param {Event} event - Select change event
     */
    const lengthChange = (event) => {
        const newSettings = {
        ...settings,
        playlistLength: event.target.value
        };
        onSettingsChange(newSettings);
    };

    /**
     * Handle explicit content preference toggle
     * Controls whether generated playlists include explicit content
     * 
     * When disabled (false):
     * - Filters out tracks with explicit lyrics/content
     * - Creates family-friendly playlists
     * - May reduce available song pool for some genres
     * 
     * When enabled (true):
     * - Includes all available content regardless of explicit rating
     * - Provides full access to Spotify's catalog
     * - May include strong language or mature themes
     * 
     * @param {Event} event - Checkbox change event
     */
    const explicitChange = (event) => {
        const newSettings = {
            ...settings,
            isExplicit: event.target.checked
        };
        onSettingsChange(newSettings);
    };

    // ========================================================================
    // COMPONENT RENDER
    // ========================================================================

    /**
     * Render settings interface with:
     * 1. Header indicating this is the settings section
     * 2. Playlist length dropdown selector
     * 3. Explicit content toggle switch
     * 
     * Design Notes:
     * - Uses semantic HTML with proper labels for accessibility
     * - Custom toggle switch provides better UX than default checkbox
     * - Dropdown shows clear options with song counts
     * - All controls are styled consistently with app theme
     */
    return (
        <div>
            {/* Settings container with header */}
            <div className='settings-container'>
                <h3 className='settings-header'>Playlist Settings</h3>
            </div>
            
            {/* ============================================================ */}
            {/* PLAYLIST LENGTH SELECTOR */}
            {/* ============================================================ */}
            <div>
                {/* Label for playlist length setting */}
                <span className='playlist-label'>Playlist Length</span>    
                
                {/* Dropdown selector for number of tracks */}
                <select 
                    value={settings.playlistLength} 
                    onChange={lengthChange} 
                    className='settings-options'
                >
                    <option value={10}>10 songs</option>
                    <option value={20}>20 songs</option>
                    <option value={30}>30 songs</option>
                </select>
            </div>
            
            {/* ============================================================ */}
            {/* EXPLICIT CONTENT TOGGLE */}
            {/* ============================================================ */}
            <div>
                {/* Label for explicit content setting */}
                <span className='content-label'>Explicit Content</span>
                
                {/* Custom toggle switch for explicit content preference */}
                <label className='switch'>
                    {/* Hidden checkbox that controls the toggle state */}
                    <input 
                        type='checkbox' 
                        onChange={explicitChange} 
                        checked={settings.isExplicit}
                    />
                    {/* Visual toggle switch element */}
                    <span className='slider-round'></span>
                </label>
            </div>
        </div>
    )
}

export default Settings;