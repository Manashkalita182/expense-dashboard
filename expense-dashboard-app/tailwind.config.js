/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        fontFamily: {
            sans: ['"Inter"', 'system-ui', 'sans-serif'],
            serif: ['"Outfit"', 'Georgia', 'serif'],
        },
        colors: {
            primary: 'var(--color-primary, #6c47ff)',
        }
      },
    },
    plugins: [],
}
