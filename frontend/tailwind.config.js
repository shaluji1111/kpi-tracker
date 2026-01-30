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
                sans: ['Outfit', 'sans-serif'],
            },
            colors: {
                'dark-bg': '#0a0a0a',
                'card-bg': '#161616',
                'neon-green': '#ccff00',
                'neon-purple': '#8b5cf6',
                'neon-blue': '#3b82f6',
            }
        },
    },
    plugins: [],
}
