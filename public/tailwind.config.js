/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: '#112240',       // Main container bg
          light: '#0A192F',         // Input bg, gradient start
          dark: '#1B263B',          // Gradient end
        },
        // Accent colors for buttons, highlights, feedback
        accent: {
          blue: '#3B82F6',          // Primary button, highlight
          yellow: '#FACC15',        // Floating label, focus border
          green: '#22C55E',         // Success messages
          red: '#EF4444',           // Error messages
          gray: '#9CA3AF',          // Inactive labels / placeholder
        },
        // Backgrounds
        background: {
          gradientStart: '#0A192F',
          gradientEnd: '#1B263B',
          container: '#112240/90',  // semi-transparent modal bg
          floatingShape1: '#3B82F6',
          floatingShape2: '#FACC15',
        },
        // Text colors
        text: {
          default: '#FFFFFF',       // Main text
          heading: '#3B82F6',       // Titles
          highlight: '#FACC15',     // Focused label
          error: '#EF4444',         // Error messages
          label: '#9CA3AF',         // Inactive label
        },
        // Border colors
        border: {
          default: '#3B82F6',       // Input border
          focus: '#FACC15',         // Input focus
          error: '#EF4444',         // Error border
        },
      },
      // Font families
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Comic Sans MS"', 'cursive'],
      },
      // Shadows
      boxShadow: {
        glow: '0 0 10px rgba(59, 130, 246, 0.5)',
        strong: '0 4px 15px rgba(0,0,0,0.3)',
      },
      
      // Border radius
      borderRadius: {
        xl: '1rem',
        '2xl': '2rem',
      },
    },
  },
  plugins: [],
}
