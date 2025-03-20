/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // 确保包括你的组件路径
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366f1", // 例如 Indigo 颜色
          foreground: "#eef2ff" // 对应 `bg-primary-foreground`
        }
      }
    }
  },
  plugins: [],
}

