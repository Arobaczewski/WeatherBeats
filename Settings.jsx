

function Settings() {

    return (
        <div>
            <div>
                <h3>Playlist Settings</h3>
            </div>
            <div>
                <span>Playlist Length</span>
                <select>
                    <option>10 songs</option>
                    <option>25 songs</option>
                    <option>50 songs</option>
                    <option>100 songs</option>
                </select>
            </div>
            <div>
                <span>Explicit Content</span>
                <button></button>
            </div>
        </div>
    )
}

export default Settings