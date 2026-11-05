export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] },
      colors: {
        brand: {
          50: '#eef3ff', 100: '#dce6ff', 200: '#b9cdff', 400: '#6f96ff',
          500: '#3f6df0', 600: '#2f54d6', 700: '#2543ad', 800: '#1f3687',
        },
      },
    },
  },
  plugins: [],
};
