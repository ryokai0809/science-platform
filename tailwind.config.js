/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // ✅ src 내부의 모든 js/ts/jsx/tsx 파일 적용
  ],
  theme: {
    extend: {
      colors: {
        primary: "#EA6137", // ✅ 정의한 primary 색상
      },
    },
  },
  plugins: [],
};
