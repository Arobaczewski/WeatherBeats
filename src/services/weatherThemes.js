import { useState, useEffect } from 'react';

export const getWeatherTheme = (weatherMain) => {
  const currentHour = new Date().getHours();
  const isDay = currentHour >= 6 && currentHour < 18;

  const themes = {
    rain: {
      name: 'rainy',
      background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)',
      accent: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
      cardBg: 'rgba(74, 85, 104, 0.15)',
      textPrimary: '#e2e8f0',
      textSecondary: 'rgba(226, 232, 240, 0.8)',
      particleColor: 'rgba(66, 153, 225, 0.1)',
      animation: 'rain-drops',
      mood: 'contemplative',
      shadows: '0 8px 32px rgba(66, 153, 225, 0.1)',
      description: 'Rainy weather brings introspective vibes and cozy indoor moments'
    },
    
    drizzle: {
      name: 'drizzle',
      background: 'linear-gradient(135deg, #718096 0%, #4a5568 50%, #2d3748 100%)',
      accent: 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)',
      cardBg: 'rgba(113, 128, 150, 0.15)',
      textPrimary: '#edf2f7',
      textSecondary: 'rgba(237, 242, 247, 0.8)',
      particleColor: 'rgba(99, 179, 237, 0.1)',
      animation: 'light-rain',
      mood: 'gentle',
      shadows: '0 8px 32px rgba(99, 179, 237, 0.1)',
      description: 'Light drizzle creates a gentle, soothing atmosphere'
    },

    thunderstorm: {
      name: 'storm',
      background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #4a5568 100%)',
      accent: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
      cardBg: 'rgba(26, 32, 44, 0.2)',
      textPrimary: '#f7fafc',
      textSecondary: 'rgba(247, 250, 252, 0.9)',
      particleColor: 'rgba(237, 137, 54, 0.2)',
      animation: 'lightning-flash',
      mood: 'intense',
      shadows: '0 8px 32px rgba(237, 137, 54, 0.2)',
      description: 'Thunderstorms demand powerful, electrifying energy'
    },

    snow: {
      name: 'winter',
      background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 50%, #a0aec0 100%)',
      accent: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
      cardBg: 'rgba(226, 232, 240, 0.2)',
      textPrimary: '#1a202c',
      textSecondary: 'rgba(26, 32, 44, 0.8)',
      particleColor: 'rgba(255, 255, 255, 0.8)',
      animation: 'snow-fall',
      mood: 'peaceful',
      shadows: '0 8px 32px rgba(160, 174, 192, 0.2)',
      description: 'Snow creates a magical winter wonderland for peaceful reflection'
    },

    clouds: {
      name: 'cloudy',
      background: 'linear-gradient(135deg, #718096 0%, #a0aec0 50%, #cbd5e0 100%)',
      accent: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      cardBg: 'rgba(113, 128, 150, 0.15)',
      textPrimary: '#2d3748',
      textSecondary: 'rgba(45, 55, 72, 0.8)',
      particleColor: 'rgba(113, 128, 150, 0.1)',
      animation: 'slow-drift',
      mood: 'contemplative',
      shadows: '0 8px 32px rgba(113, 128, 150, 0.1)',
      description: 'Overcast skies bring balanced, thoughtful moments'
    },

    mist: {
      name: 'misty',
      background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 50%, #a0aec0 100%)',
      accent: 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)',
      cardBg: 'rgba(226, 232, 240, 0.1)',
      textPrimary: '#4a5568',
      textSecondary: 'rgba(74, 85, 104, 0.7)',
      particleColor: 'rgba(159, 122, 234, 0.1)',
      animation: 'mist-float',
      mood: 'ethereal',
      shadows: '0 8px 32px rgba(159, 122, 234, 0.1)',
      description: 'Misty conditions create an ethereal, mysterious atmosphere'
    },

    smoke: {
      name: 'smoky',
      background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)',
      accent: 'linear-gradient(135deg, #ed8936 0%, #c05621 100%)',
      cardBg: 'rgba(74, 85, 104, 0.2)',
      textPrimary: '#f7fafc',
      textSecondary: 'rgba(247, 250, 252, 0.8)',
      particleColor: 'rgba(237, 137, 54, 0.1)',
      animation: 'smoke-drift',
      mood: 'gritty',
      shadows: '0 8px 32px rgba(237, 137, 54, 0.2)',
      description: 'Smoky air brings urban edge and alternative vibes'
    },

    haze: {
      name: 'hazy',
      background: 'linear-gradient(135deg, #fbb6ce 0%, #f687b3 50%, #ed64a6 100%)',
      accent: 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)',
      cardBg: 'rgba(251, 182, 206, 0.15)',
      textPrimary: '#2d3748',
      textSecondary: 'rgba(45, 55, 72, 0.8)',
      particleColor: 'rgba(159, 122, 234, 0.1)',
      animation: 'psychedelic-wave',
      mood: 'dreamy',
      shadows: '0 8px 32px rgba(159, 122, 234, 0.2)',
      description: 'Hazy skies blur reality and dreams into psychedelic soundscapes'
    },

    dust: {
      name: 'dusty',
      background: 'linear-gradient(135deg, #d69e2e 0%, #b7791f 50%, #975a16 100%)',
      accent: 'linear-gradient(135deg, #ed8936 0%, #c05621 100%)',
      cardBg: 'rgba(214, 158, 46, 0.15)',
      textPrimary: '#1a202c',
      textSecondary: 'rgba(26, 32, 44, 0.8)',
      particleColor: 'rgba(214, 158, 46, 0.2)',
      animation: 'dust-swirl',
      mood: 'rugged',
      shadows: '0 8px 32px rgba(214, 158, 46, 0.2)',
      description: 'Dusty conditions evoke wide open spaces and desert rock vibes'
    },

    fog: {
      name: 'foggy',
      background: 'linear-gradient(135deg, #edf2f7 0%, #e2e8f0 50%, #cbd5e0 100%)',
      accent: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
      cardBg: 'rgba(237, 242, 247, 0.1)',
      textPrimary: '#1a202c',
      textSecondary: 'rgba(26, 32, 44, 0.7)',
      particleColor: 'rgba(203, 213, 224, 0.3)',
      animation: 'fog-roll',
      mood: 'mysterious',
      shadows: '0 8px 32px rgba(203, 213, 224, 0.2)',
      description: 'Dense fog creates an intimate, minimalist world'
    },

    ash: {
      name: 'apocalyptic',
      background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 50%, #171923 100%)',
      accent: 'linear-gradient(135deg, #fc8181 0%, #e53e3e 100%)',
      cardBg: 'rgba(45, 55, 72, 0.2)',
      textPrimary: '#f56565',
      textSecondary: 'rgba(245, 101, 101, 0.8)',
      particleColor: 'rgba(245, 101, 101, 0.1)',
      animation: 'ash-fall',
      mood: 'ominous',
      shadows: '0 8px 32px rgba(245, 101, 101, 0.2)',
      description: 'Ash brings apocalyptic atmosphere for dark ambient sounds'
    },

    tornado: {
      name: 'chaotic',
      background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 25%, #4a5568 50%, #2d3748 75%, #1a202c 100%)',
      accent: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 50%, #c05621 100%)',
      cardBg: 'rgba(26, 32, 44, 0.3)',
      textPrimary: '#fbb6ce',
      textSecondary: 'rgba(251, 182, 206, 0.9)',
      particleColor: 'rgba(237, 137, 54, 0.3)',
      animation: 'tornado-spin',
      mood: 'chaotic',
      shadows: '0 8px 32px rgba(237, 137, 54, 0.3)',
      description: 'Tornado conditions demand the most intense, chaotic music'
    },

    clearDay: {
      name: 'sunny',
      background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)',
      accent: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      cardBg: 'rgba(254, 215, 170, 0.15)',
      textPrimary: '#92400e',
      textSecondary: 'rgba(146, 64, 14, 0.8)',
      particleColor: 'rgba(251, 191, 36, 0.2)',
      animation: 'sun-rays',
      mood: 'energetic',
      shadows: '0 8px 32px rgba(251, 191, 36, 0.2)',
      description: 'Clear sunny skies call for bright, uplifting music'
    },

    clearNight: {
      name: 'starry',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)',
      accent: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
      cardBg: 'rgba(30, 27, 75, 0.2)',
      textPrimary: '#c4b5fd',
      textSecondary: 'rgba(196, 181, 253, 0.8)',
      particleColor: 'rgba(167, 139, 250, 0.2)',
      animation: 'twinkling-stars',
      mood: 'romantic',
      shadows: '0 8px 32px rgba(167, 139, 250, 0.2)',
      description: 'Clear night skies perfect for romantic, dreamy vibes'
    }
  };


  let themeKey = weatherMain.toLowerCase();
  
  if (themeKey === 'clear') {
    themeKey = isDay ? 'clearDay' : 'clearNight';
  }

  return themes[themeKey] || themes.clearDay;
};

export const useWeatherTheme = (weatherData) => {
  const [currentTheme, setCurrentTheme] = useState(null);

  useEffect(() => {
    if (weatherData && weatherData.weather && weatherData.weather[0]) {
      const theme = getWeatherTheme(weatherData.weather[0].main);
      setCurrentTheme(theme);
      
      // Apply CSS custom properties to root
      const root = document.documentElement;
      root.style.setProperty('--theme-background', theme.background);
      root.style.setProperty('--theme-accent', theme.accent);
      root.style.setProperty('--theme-card-bg', theme.cardBg);
      root.style.setProperty('--theme-text-primary', theme.textPrimary);
      root.style.setProperty('--theme-text-secondary', theme.textSecondary);
      root.style.setProperty('--theme-particle-color', theme.particleColor);
      root.style.setProperty('--theme-shadows', theme.shadows);
      
      // Add theme class to body
      document.body.className = `theme-${theme.name}`;
      
      // Add mood class for additional styling
      document.body.setAttribute('data-mood', theme.mood);
      
      // Announce theme change to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.style.width = '1px';
      announcement.style.height = '1px';
      announcement.style.overflow = 'hidden';
      announcement.textContent = `Theme changed to ${theme.mood} mood for ${weatherData.weather[0].main} weather`;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, [weatherData]);

  return currentTheme;
};

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


export const weatherThemes = {
  rain: () => getWeatherTheme('rain'),
  snow: () => getWeatherTheme('snow'),
  sunny: () => getWeatherTheme('clear'),
  stormy: () => getWeatherTheme('thunderstorm'),
  cloudy: () => getWeatherTheme('clouds'),
  misty: () => getWeatherTheme('mist')
};