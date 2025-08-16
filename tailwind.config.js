/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PHYGHT Brand Colors - Black, White, Red
        phyght: {
          black: '#000000',      // Pure black background
          white: '#FFFFFF',      // Pure white text
          red: '#FF0000',        // Bright red accent
          'red-dark': '#CC0000', // Darker red for shadows
          'red-light': '#FF3333', // Lighter red for highlights
          gray: '#1A1A1A',       // Dark gray for secondary elements
          'gray-light': '#333333', // Light gray for borders
        },
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF0000',        // PHYGHT red
          600: '#CC0000',        // Darker red
          700: '#B30000',        // Even darker red
          800: '#990000',
          900: '#800000',
        },
        secondary: {
          500: '#FFFFFF',        // PHYGHT white
          600: '#F0F0F0',       // Light white
        },
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          850: '#1a1f2e',
          900: '#111827',
          950: '#000000',        // PHYGHT black
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
        'bounce-slow': 'bounce 2s infinite',
        'glow-red': 'glow-red 2s ease-in-out infinite alternate',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'phyght': ['Orbitron', 'monospace'], // Futuristic font for PHYGHT branding
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 0, 0, 0.3)',      // PHYGHT red glow
        'glow-lg': '0 0 40px rgba(255, 0, 0, 0.4)',   // Larger PHYGHT red glow
        'phyght-red': '0 0 30px rgba(255, 0, 0, 0.5)', // PHYGHT signature glow
      },
      keyframes: {
        'glow-red': {
          '0%': { boxShadow: '0 0 20px rgba(255, 0, 0, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(255, 0, 0, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
