import { useState } from "react";

function WeatherCard (){
    const [weather, setWeather] = useState({
        main: '',
        temp: 0,
        description: '',

    });


    return (
        <div>
            <div>
                <span>Location</span>
            </div>
            <div>
                <span>Weather</span>
                <span>Weather Description</span>
            </div>
            <div>
                <span>Local Time</span>
                <span>Weather Picture</span>
            </div>
        </div>
    )
}

export default WeatherCard