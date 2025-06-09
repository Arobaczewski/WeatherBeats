import { useEffect, useState } from 'react';
import '../CSS/Settings.css';

function Settings({ settings, onSettingsChange }) {

    const lengthChange = (event) => {
        const newSettings = {
        ...settings,
        playlistLength: event.target.value
        };
        onSettingsChange(newSettings);
    };


    const explicitChange = (event) => {
        const newSettings = {
            ...settings,
            isExplicit: event.target.checked
        };
        onSettingsChange(newSettings);
    };


    return (
        <div>
            <div className='settings-container'>
                <h3 className='settings-header'>Playlist Settings</h3>
            </div>
            <div>
                <span className='playlist-label'>Playlist Length</span>    
                <select value={settings.playlistLength} onChange={lengthChange} className='settings-options'>
                    <option value={10}>10 songs</option>
                    <option value={20}>20 songs</option>
                    <option value={30}>30 songs</option>
                </select>
            </div>
            <div>
                <span className='content-label'>Explicit Content</span>
                <label className='switch'>
                    <input type='checkbox' onChange={explicitChange} checked={settings.isExplicit}/>
                    <span className='slider-round'></span>
                </label>
            </div>
        </div>
    )
}

export default Settings;