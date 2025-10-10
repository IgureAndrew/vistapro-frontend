/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"   // ← where shadcn-ui dumped its files
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("@shadcn/ui/tailwind")(),      // ← enable the plugin
  ],
};
