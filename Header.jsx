import { useState } from "react";
import '../CSS/Header.css';

function Header() {
    

    return (
        <div className="header-container">
            <h1 className="header">WeatherBeats</h1>
            <button className="connect-btn">Connect Spotify</button>
        </div>
    )
}

export default Header