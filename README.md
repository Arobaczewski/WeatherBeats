# WeatherBeats 🌤️🎵

**Live Demo:** [weatherbeatz.netlify.app](https://weatherbeatz.netlify.app/)

An intelligent music discovery application that creates personalized playlists based on real-time weather conditions. WeatherBeats bridges the gap between environmental atmosphere and musical mood, using sophisticated algorithms to curate the perfect soundtrack for any weather.

![WeatherBeats Demo](https://via.placeholder.com/800x400/667eea/ffffff?text=WeatherBeats+Demo)

## 🚀 Key Features

### 🎯 Intelligent Music Curation
- **Advanced Search-Based Algorithm**: Custom recommendation engine using multi-strategy Spotify API searches
- **Weather-to-Music Mapping**: Sophisticated algorithm mapping 12+ weather conditions to appropriate musical moods and genres
- **Regional Content Optimization**: Automatically detects user's market and optimizes song availability across global regions
- **Quality Filtering**: Implements duration, popularity, and content filtering for curated results
- **Artist Variety Control**: Ensures diverse playlists by limiting tracks per artist while maintaining randomness

### 🌍 Weather Integration
- **Real-Time Weather Data**: OpenWeatherMap API integration with comprehensive condition support
- **Location-Based Experience**: Automatic geolocation detection for accurate local weather
- **Day/Night Awareness**: Different music recommendations based on time of day for contextual relevance

### 🎨 Dynamic Theming System
- **Weather-Responsive UI**: 14+ unique visual themes that change based on weather conditions
- **Immersive Animations**: CSS-based particle systems simulating rain, snow, storms, and other weather effects
- **Glassmorphism Design**: Modern UI with backdrop blur effects and dynamic color schemes
- **Mood-Based Interactions**: Subtle animations that reflect the emotional quality of weather conditions

### 🎵 Spotify Integration
- **OAuth 2.0 with PKCE**: Secure authentication using industry-standard security practices
- **Playlist Creation**: Save generated playlists directly to user's Spotify account
- **Direct Playback Links**: One-click access to full tracks in Spotify
- **Rich Metadata Display**: Album artwork, artist information, duration, and popularity scores

### 📱 User Experience
- **Mobile-First Design**: Responsive layout optimized for all device sizes
- **Accessibility Features**: Screen reader support, keyboard navigation, reduced motion options
- **Intelligent Pagination**: Smooth navigation through large playlists
- **Real-Time Feedback**: Comprehensive loading states and error handling
- **Customizable Settings**: Playlist length and explicit content filtering

## 🛠️ Technical Architecture

### Frontend Technologies
- **React 18**: Modern functional components with hooks for state management
- **CSS3**: Advanced features including custom properties, backdrop filters, and CSS Grid
- **Lucide React**: Consistent, scalable icon system
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox

### APIs & Services
- **Spotify Web API**: Music search, user authentication, and playlist management
- **OpenWeatherMap API**: Real-time weather data and forecasting
- **OAuth 2.0**: Secure user authentication with PKCE flow

### Key Technical Implementations

#### 🔍 Search-Based Recommendation Engine
Instead of relying on basic recommendation APIs, WeatherBeats implements a sophisticated search strategy:

```javascript
// Multi-angle search approach
const queries = [
  // Genre-based with temporal filtering
  `genre:${genre} year:2023-2024`,
  
  // Artist-specific targeting
  `artist:"${artist}"`,
  
  // Mood and keyword searches
  `${mood} music`,
  `${weatherCondition} vibes`,
  
  // Trending and popularity
  'trending 2024',
  'viral songs'
];
```

#### 🎨 Dynamic Theming System
Weather conditions trigger real-time CSS custom property updates:

```javascript
// Dynamic theme application
const root = document.documentElement;
root.style.setProperty('--theme-background', theme.background);
root.style.setProperty('--theme-accent', theme.accent);
root.style.setProperty('--theme-text-primary', theme.textPrimary);
```

#### 🌧️ Weather Animation System
CSS-only particle effects for immersive experience:

```css
/* Rain effect example */
.theme-rainy::before {
  background: linear-gradient(transparent 50%, var(--theme-particle-color) 52%);
  animation: rain-drops 0.8s linear infinite;
}
```

#### 🔐 Security Implementation
- **PKCE Flow**: Code challenge/verifier for secure OAuth without client secrets
- **Token Management**: Automatic refresh with session persistence
- **Error Handling**: Comprehensive API error management with user-friendly messages

### Performance Optimizations
- **Hardware Acceleration**: GPU-accelerated animations for smooth performance
- **Lazy Loading**: Efficient resource loading and image optimization
- **Rate Limiting**: Intelligent API call management to prevent service limits
- **Caching Strategy**: Session-based token and data caching

### Accessibility & UX
- **WCAG Compliance**: High contrast mode, reduced motion support, screen reader compatibility
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Error Recovery**: Helpful error messages with actionable recovery options
- **Loading States**: Clear feedback during asynchronous operations

## 🏗️ Project Structure

```
weatherbeats/
├── src/
│   ├── Components/           # React components
│   │   ├── Header.jsx       # Spotify authentication
│   │   ├── WeatherCard.jsx  # Weather display & music mood
│   │   ├── Playlists.jsx    # Music generation & display
│   │   ├── Settings.jsx     # User preferences
│   │   └── Card.jsx         # Weather-to-music mapping
│   ├── CSS/                 # Styling system
│   │   ├── App.css          # Layout & weather animations
│   │   ├── index.css        # Global theming & particles
│   │   ├── Header.css       # Authentication UI
│   │   ├── WeatherCard.css  # Weather display styling
│   │   ├── Playlists.css    # Music interface
│   │   ├── Settings.css     # User controls
│   │   └── Card.css         # Music mood display
│   ├── services/
│   │   ├── api.js           # Spotify API & weather services
│   │   └── weatherThemes.js # Dynamic theming system
│   ├── App.jsx              # Main application controller
│   └── main.jsx             # Application entry point
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- Spotify Developer Account
- OpenWeatherMap API Account

### Environment Setup
Create a `.env` file in the root directory:

```env
VITE_SPOTIFY_API_KEY=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_WEATHER_API_KEY=your_openweathermap_api_key
```

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/yourusername/weatherbeats.git
cd weatherbeats

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### API Setup

#### Spotify Developer Setup
1. Create app at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Add redirect URI: `https://yourapp.netlify.app/`
3. Copy Client ID to environment variables
4. Configure OAuth scopes: `playlist-modify-public playlist-modify-private user-read-private`

#### OpenWeatherMap Setup
1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Generate API key
3. Add to environment variables

## 🎯 Core Features Deep Dive

### Weather-to-Music Algorithm
The application maps weather conditions to musical characteristics using psychological research and empirical data:

- **Rain/Drizzle**: Contemplative, introspective music (Lo-fi, Ambient, Indie Folk)
- **Thunderstorms**: High-energy, intense music (Rock, Electronic, Metal)
- **Snow**: Peaceful, winter-themed music (Classical, Ambient, Folk)
- **Clear Day**: Upbeat, energetic music (Pop, Reggae, Happy Hip Hop)
- **Clear Night**: Romantic, relaxed music (R&B, Smooth Jazz, Chillwave)
- **Clouds**: Balanced, alternative music (Indie Pop, Soft Electronic)

### Quality Assurance Features
- **Duration Filtering**: Removes very short (<30s) or very long (>10min) tracks
- **Popularity Thresholds**: Filters out tracks with insufficient popularity scores
- **Content Appropriateness**: Explicit content filtering based on user preferences
- **Market Availability**: Ensures tracks are available in user's region

## 🌟 Technical Highlights for Employers

### Problem-Solving & Innovation
- **Custom Recommendation Engine**: Built proprietary algorithm instead of using basic recommendation APIs
- **Regional Content Challenges**: Solved global music availability issues with market detection and fallback strategies
- **Performance Optimization**: Implemented efficient API usage patterns to handle rate limiting
- **User Experience**: Created seamless integration between weather data and music discovery

### Code Quality & Architecture
- **Comprehensive Documentation**: Detailed inline comments explaining complex algorithms
- **Modular Design**: Separation of concerns with dedicated services and components
- **Error Handling**: Robust error management with user-friendly feedback
- **Responsive Design**: Mobile-first approach with advanced CSS techniques

### API Integration Expertise
- **OAuth 2.0 Implementation**: Secure authentication with PKCE flow
- **RESTful API Consumption**: Multiple API integrations with proper error handling
- **Rate Limiting Management**: Intelligent request throttling and retry mechanisms
- **Data Transformation**: Complex data processing and formatting for optimal UX

### UI/UX Development
- **Dynamic Theming**: Real-time visual changes based on external data
- **Animation Systems**: CSS-based particle effects and micro-interactions
- **Accessibility**: WCAG compliance with reduced motion and high contrast support
- **Progressive Enhancement**: Functional core experience with enhanced features

## 📈 Future Enhancements

### Planned Features
- **Machine Learning Integration**: User behavior analysis for improved recommendations
- **Social Features**: Playlist sharing and collaborative weather playlists
- **Extended Weather Data**: Air quality, UV index, and seasonal influences
- **Music Analysis**: Audio feature matching (energy, danceability, valence)
- **Offline Support**: Service worker implementation for offline functionality

### Technical Improvements
- **Performance Monitoring**: Analytics integration for user experience optimization
- **Advanced Caching**: Redis implementation for improved response times
- **Microservices Architecture**: Scalable backend with dedicated recommendation service
- **A/B Testing**: Feature flag system for experimental features

## 📞 Contact & Links

**Portfolio**: []()
**LinkedIn**: [linkedin.com/in/alexander-robaczewski](https://linkedin.com/in/alexander-robaczewski)
**Email**: alexander.robaczewski@gmail.com
---

*WeatherBeats demonstrates full-stack development skills, API integration expertise, advanced CSS techniques, and user-centered design thinking. The project showcases ability to solve complex technical challenges while maintaining excellent user experience and code quality.*