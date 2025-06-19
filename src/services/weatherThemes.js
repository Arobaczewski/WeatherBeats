import { useState, useEffect } from 'react';

/**
 * WEATHER-BASED THEME SYSTEM
 * 
 * This module creates dynamic UI themes that respond to real-time weather conditions.
 * Each weather type triggers a unique visual theme with matching colors, animations, 
 * and mood to enhance the user's music discovery experience.
 * 
 * Key Features:
 * - 14+ unique weather-responsive themes
 * - Day/night detection for contextual theming
 * - CSS custom properties for dynamic styling
 * - Accessibility features with screen reader announcements
 * - Smooth theme transitions and visual effects
 */

/**
 * Core theme generation function that maps weather conditions to visual themes
 * 
 * @param {string} weatherMain - Primary weather condition from weather API (e.g., 'Rain', 'Snow', 'Clear')
 * @returns {Object} Complete theme object with colors, animations, and metadata
 * 
 * Architecture Decision: Centralized theme objects allow for easy maintenance and 
 * consistent styling across the entire application
 */
export const getWeatherTheme = (weatherMain) => {
  // Time-based theme detection: Different themes for day vs night clear weather
  const currentHour = new Date().getHours();
  const isDay = currentHour >= 6 && currentHour < 18; // 6 AM to 6 PM considered daytime

  // COMPREHENSIVE THEME DEFINITIONS
  // Each theme includes: visual styling, UX mood, accessibility features, and contextual descriptions
  const themes = {
    // PRECIPITATION THEMES - Darker, more contemplative color palettes
    rain: {
      name: 'rainy',
      background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)', // Dark blue-gray gradient
      accent: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)', // Blue accent for water association
      cardBg: 'rgba(74, 85, 104, 0.15)', // Semi-transparent card backgrounds
      textPrimary: '#e2e8f0', // High contrast light text for accessibility
      textSecondary: 'rgba(226, 232, 240, 0.8)', // Slightly transparent secondary text
      particleColor: 'rgba(66, 153, 225, 0.1)', // Subtle particle effects color
      animation: 'rain-drops', // CSS animation class name
      mood: 'contemplative', // Emotional context for music matching
      shadows: '0 8px 32px rgba(66, 153, 225, 0.1)', // Soft shadows matching theme
      description: 'Rainy weather brings introspective vibes and cozy indoor moments'
    },
    
    drizzle: {
      name: 'drizzle',
      background: 'linear-gradient(135deg, #718096 0%, #4a5568 50%, #2d3748 100%)', // Lighter than rain theme
      accent: 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)',
      cardBg: 'rgba(113, 128, 150, 0.15)',
      textPrimary: '#edf2f7',
      textSecondary: 'rgba(237, 242, 247, 0.8)',
      particleColor: 'rgba(99, 179, 237, 0.1)',
      animation: 'light-rain', // Gentler animation than full rain
      mood: 'gentle',
      shadows: '0 8px 32px rgba(99, 179, 237, 0.1)',
      description: 'Light drizzle creates a gentle, soothing atmosphere'
    },

    // EXTREME WEATHER THEMES - High contrast and dramatic styling
    thunderstorm: {
      name: 'storm',
      background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #4a5568 100%)', // Very dark for drama
      accent: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)', // Orange/yellow for lightning
      cardBg: 'rgba(26, 32, 44, 0.2)',
      textPrimary: '#f7fafc', // Maximum contrast white text
      textSecondary: 'rgba(247, 250, 252, 0.9)',
      particleColor: 'rgba(237, 137, 54, 0.2)', // Lightning-colored particles
      animation: 'lightning-flash', // Dramatic flashing animation
      mood: 'intense',
      shadows: '0 8px 32px rgba(237, 137, 54, 0.2)',
      description: 'Thunderstorms demand powerful, electrifying energy'
    },

    // WINTER THEME - Clean, bright palette
    snow: {
      name: 'winter',
      background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 50%, #a0aec0 100%)', // Light grays and whites
      accent: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)', // Cool blue accent
      cardBg: 'rgba(226, 232, 240, 0.2)',
      textPrimary: '#1a202c', // Dark text on light background (inverted from rain)
      textSecondary: 'rgba(26, 32, 44, 0.8)',
      particleColor: 'rgba(255, 255, 255, 0.8)', // White snowflake particles
      animation: 'snow-fall',
      mood: 'peaceful',
      shadows: '0 8px 32px rgba(160, 174, 192, 0.2)',
      description: 'Snow creates a magical winter wonderland for peaceful reflection'
    },

    // ATMOSPHERIC CONDITIONS - Subtle, nuanced themes
    clouds: {
      name: 'cloudy',
      background: 'linear-gradient(135deg, #718096 0%, #a0aec0 50%, #cbd5e0 100%)', // Gray gradient
      accent: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple accent for sophistication
      cardBg: 'rgba(113, 128, 150, 0.15)',
      textPrimary: '#2d3748',
      textSecondary: 'rgba(45, 55, 72, 0.8)',
      particleColor: 'rgba(113, 128, 150, 0.1)',
      animation: 'slow-drift', // Slow, subtle movement
      mood: 'contemplative',
      shadows: '0 8px 32px rgba(113, 128, 150, 0.1)',
      description: 'Overcast skies bring balanced, thoughtful moments'
    },

    mist: {
      name: 'misty',
      background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 50%, #a0aec0 100%)',
      accent: 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)', // Purple for ethereal feel
      cardBg: 'rgba(226, 232, 240, 0.1)',
      textPrimary: '#4a5568',
      textSecondary: 'rgba(74, 85, 104, 0.7)',
      particleColor: 'rgba(159, 122, 234, 0.1)',
      animation: 'mist-float',
      mood: 'ethereal',
      shadows: '0 8px 32px rgba(159, 122, 234, 0.1)',
      description: 'Misty conditions create an ethereal, mysterious atmosphere'
    },

    // INDUSTRIAL/URBAN THEMES - Edgier color palettes
    smoke: {
      name: 'smoky',
      background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)',
      accent: 'linear-gradient(135deg, #ed8936 0%, #c05621 100%)', // Orange for fire/smoke
      cardBg: 'rgba(74, 85, 104, 0.2)',
      textPrimary: '#f7fafc',
      textSecondary: 'rgba(247, 250, 252, 0.8)',
      particleColor: 'rgba(237, 137, 54, 0.1)',
      animation: 'smoke-drift',
      mood: 'gritty', // Urban, alternative music mood
      shadows: '0 8px 32px rgba(237, 137, 54, 0.2)',
      description: 'Smoky air brings urban edge and alternative vibes'
    },

    // CREATIVE/ARTISTIC THEMES - Bold, unconventional color choices
    haze: {
      name: 'hazy',
      background: 'linear-gradient(135deg, #fbb6ce 0%, #f687b3 50%, #ed64a6 100%)', // Pink gradient
      accent: 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)', // Purple accent
      cardBg: 'rgba(251, 182, 206, 0.15)',
      textPrimary: '#2d3748',
      textSecondary: 'rgba(45, 55, 72, 0.8)',
      particleColor: 'rgba(159, 122, 234, 0.1)',
      animation: 'psychedelic-wave', // Creative animation name
      mood: 'dreamy', // Psychedelic, experimental music mood
      shadows: '0 8px 32px rgba(159, 122, 234, 0.2)',
      description: 'Hazy skies blur reality and dreams into psychedelic soundscapes'
    },

    // DESERT/EARTH THEMES - Warm, earthy palettes
    dust: {
      name: 'dusty',
      background: 'linear-gradient(135deg, #d69e2e 0%, #b7791f 50%, #975a16 100%)', // Yellow-brown gradient
      accent: 'linear-gradient(135deg, #ed8936 0%, #c05621 100%)',
      cardBg: 'rgba(214, 158, 46, 0.15)',
      textPrimary: '#1a202c',
      textSecondary: 'rgba(26, 32, 44, 0.8)',
      particleColor: 'rgba(214, 158, 46, 0.2)',
      animation: 'dust-swirl',
      mood: 'rugged', // Western, rock music mood
      shadows: '0 8px 32px rgba(214, 158, 46, 0.2)',
      description: 'Dusty conditions evoke wide open spaces and desert rock vibes'
    },

    // MINIMAL THEMES - Subtle, clean aesthetics
    fog: {
      name: 'foggy',
      background: 'linear-gradient(135deg, #edf2f7 0%, #e2e8f0 50%, #cbd5e0 100%)', // Very light grays
      accent: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)', // Dark accent for contrast
      cardBg: 'rgba(237, 242, 247, 0.1)',
      textPrimary: '#1a202c',
      textSecondary: 'rgba(26, 32, 44, 0.7)',
      particleColor: 'rgba(203, 213, 224, 0.3)',
      animation: 'fog-roll',
      mood: 'mysterious', // Ambient, minimal music mood
      shadows: '0 8px 32px rgba(203, 213, 224, 0.2)',
      description: 'Dense fog creates an intimate, minimalist world'
    },

    // EXTREME/APOCALYPTIC THEMES - Dramatic, high-impact styling
    ash: {
      name: 'apocalyptic',
      background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 50%, #171923 100%)', // Very dark
      accent: 'linear-gradient(135deg, #fc8181 0%, #e53e3e 100%)', // Red for danger/fire
      cardBg: 'rgba(45, 55, 72, 0.2)',
      textPrimary: '#f56565', // Red text for dramatic effect
      textSecondary: 'rgba(245, 101, 101, 0.8)',
      particleColor: 'rgba(245, 101, 101, 0.1)',
      animation: 'ash-fall',
      mood: 'ominous', // Dark ambient, experimental music
      shadows: '0 8px 32px rgba(245, 101, 101, 0.2)',
      description: 'Ash brings apocalyptic atmosphere for dark ambient sounds'
    },

    tornado: {
      name: 'chaotic',
      background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 25%, #4a5568 50%, #2d3748 75%, #1a202c 100%)', // Complex multi-stop gradient
      accent: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 50%, #c05621 100%)',
      cardBg: 'rgba(26, 32, 44, 0.3)',
      textPrimary: '#fbb6ce', // Unexpected pink for chaos
      textSecondary: 'rgba(251, 182, 206, 0.9)',
      particleColor: 'rgba(237, 137, 54, 0.3)',
      animation: 'tornado-spin', // Spinning animation
      mood: 'chaotic', // Intense, chaotic music genres
      shadows: '0 8px 32px rgba(237, 137, 54, 0.3)',
      description: 'Tornado conditions demand the most intense, chaotic music'
    },

    // CLEAR WEATHER THEMES - Bright, optimistic palettes with day/night variants
    clearDay: {
      name: 'sunny',
      background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)', // Warm orange gradient
      accent: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', // Yellow accent
      cardBg: 'rgba(254, 215, 170, 0.15)',
      textPrimary: '#92400e', // Dark brown for readability on light background
      textSecondary: 'rgba(146, 64, 14, 0.8)',
      particleColor: 'rgba(251, 191, 36, 0.2)',
      animation: 'sun-rays', // Radiating sun animation
      mood: 'energetic', // Upbeat, energetic music
      shadows: '0 8px 32px rgba(251, 191, 36, 0.2)',
      description: 'Clear sunny skies call for bright, uplifting music'
    },

    clearNight: {
      name: 'starry',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)', // Deep purple night sky
      accent: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', // Light purple accent
      cardBg: 'rgba(30, 27, 75, 0.2)',
      textPrimary: '#c4b5fd', // Light purple text
      textSecondary: 'rgba(196, 181, 253, 0.8)',
      particleColor: 'rgba(167, 139, 250, 0.2)', // Twinkling star particles
      animation: 'twinkling-stars',
      mood: 'romantic', // Romantic, chill music for nighttime
      shadows: '0 8px 32px rgba(167, 139, 250, 0.2)',
      description: 'Clear night skies perfect for romantic, dreamy vibes'
    }
  };

  // INTELLIGENT THEME SELECTION LOGIC
  // Convert weather condition to lowercase for case-insensitive matching
  let themeKey = weatherMain.toLowerCase();
  
  // Special handling for clear weather: different themes for day vs night
  if (themeKey === 'clear') {
    themeKey = isDay ? 'clearDay' : 'clearNight';
  }

  // Return matched theme or default to sunny theme as fallback
  return themes[themeKey] || themes.clearDay;
};

/**
 * React Hook for Dynamic Theme Management
 * 
 * This custom hook handles:
 * - Theme state management
 * - CSS custom property injection
 * - DOM class manipulation
 * - Accessibility announcements
 * - Automatic theme updates when weather changes
 * 
 * @param {Object} weatherData - Weather data object from API
 * @returns {Object} Current active theme object
 * 
 * Design Pattern: Custom hooks encapsulate complex state logic and side effects,
 * making components cleaner and theme logic reusable across the app
 */
export const useWeatherTheme = (weatherData) => {
  // State to track current active theme
  const [currentTheme, setCurrentTheme] = useState(null);

  // Effect hook to handle theme changes when weather data updates
  useEffect(() => {
    // Validate weather data structure before processing
    if (weatherData && weatherData.weather && weatherData.weather[0]) {
      // Generate new theme based on current weather
      const theme = getWeatherTheme(weatherData.weather[0].main);
      setCurrentTheme(theme);
      
      // DYNAMIC CSS INJECTION
      // Apply theme colors as CSS custom properties for global styling
      const root = document.documentElement;
      root.style.setProperty('--theme-background', theme.background);
      root.style.setProperty('--theme-accent', theme.accent);
      root.style.setProperty('--theme-card-bg', theme.cardBg);
      root.style.setProperty('--theme-text-primary', theme.textPrimary);
      root.style.setProperty('--theme-text-secondary', theme.textSecondary);
      root.style.setProperty('--theme-particle-color', theme.particleColor);
      root.style.setProperty('--theme-shadows', theme.shadows);
      
      // DYNAMIC CLASS MANAGEMENT
      // Apply theme-specific CSS classes for animations and styling
      document.body.className = `theme-${theme.name}`;
      
      // Add mood attribute for additional CSS targeting
      document.body.setAttribute('data-mood', theme.mood);
      
      // ACCESSIBILITY ENHANCEMENT
      // Create screen reader announcement for theme changes
      // This helps visually impaired users understand the interface changes
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite'); // Non-interrupting announcement
      announcement.setAttribute('aria-atomic', 'true'); // Read entire content at once
      
      // Position announcement off-screen (screen reader accessible but visually hidden)
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.style.width = '1px';
      announcement.style.height = '1px';
      announcement.style.overflow = 'hidden';
      
      // Descriptive announcement text
      announcement.textContent = `Theme changed to ${theme.mood} mood for ${weatherData.weather[0].main} weather`;
      document.body.appendChild(announcement);
      
      // Clean up announcement element after screen reader processes it
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, [weatherData]); // Re-run effect when weather data changes

  return currentTheme;
};

/**
 * Theme Preview Utility Function
 * 
 * Generates theme preview data for UI components like theme selectors or demos
 * 
 * @param {string} weatherType - Weather condition type
 * @returns {Object} Simplified theme preview object
 * 
 * Use Case: Theme picker components, style guides, or theme demonstrations
 */
export const getThemePreview = (weatherType) => {
  const theme = getWeatherTheme(weatherType);
  return {
    name: theme.name,
    mood: theme.mood,
    description: theme.description,
    colors: {
      background: theme.background,
      accent: theme.accent,
      text: theme.textPrimary
    }
  };
};

/**
 * Simplified Theme Access Object
 * 
 * Provides easy access to common themes for testing or manual theme switching
 * Each function returns a fresh theme object to prevent reference issues
 * 
 * Usage: weatherThemes.rain() or weatherThemes.sunny()
 */
export const weatherThemes = {
  rain: () => getWeatherTheme('rain'),
  snow: () => getWeatherTheme('snow'),
  sunny: () => getWeatherTheme('clear'),
  stormy: () => getWeatherTheme('thunderstorm'),
  cloudy: () => getWeatherTheme('clouds'),
  misty: () => getWeatherTheme('mist')
};