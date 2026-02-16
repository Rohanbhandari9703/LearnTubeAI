/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./componenets/**/*.{js,ts,jsx,tsx}", // Note: keeping user's typo 'componenets'
    ],

    theme: {
        extend: {},
    },
    plugins: [],
}
