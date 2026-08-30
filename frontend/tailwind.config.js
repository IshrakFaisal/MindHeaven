/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pine: {
          50: '#eef7f4',
          100: '#dceee8',
          200: '#c2ddd5',
          300: '#98c5b9',
          400: '#65a696',
          500: '#3f8a79',
          600: '#247565',
          700: '#1d6155',
          800: '#184e46',
          900: '#153f3a',
          950: '#102f2c'
        },
        slate: {
          50: '#f6f7f6', 100: '#edf0ef', 200: '#dce2df', 300: '#abb5b1',
          400: '#7c8985', 500: '#64716d', 600: '#4f5d59', 700: '#3c4945',
          800: '#293632', 900: '#1d2926', 950: '#131d1a'
        },
        coral: {
          50: '#fff8f2',
          100: '#fdebdc',
          200: '#f9d3b8',
          300: '#f3ae7d',
          400: '#e98d54',
          500: '#d9723c',
          600: '#be592d',
          700: '#9e4527',
          800: '#803923',
          900: '#69311f'
        },
        canvas: '#f7f6f1',
        ink: '#17322f'
      },
      boxShadow: {
        soft: '0 18px 44px rgba(26, 47, 43, 0.10)',
        card: '0 2px 6px rgba(26, 47, 43, 0.025), 0 12px 30px rgba(26, 47, 43, 0.045)'
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
