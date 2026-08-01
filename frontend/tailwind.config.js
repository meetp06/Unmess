/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#101211",
        surface: "#151816",
        raised: "#1b1f1c",
        line: "#2a302b",
        ink: "#f0f1eb",
        muted: "#9ba39b",
        green: "#9be66b",
        amber: "#f3c969",
        danger: "#fb7f72"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["SFMono-Regular", "Consolas", "Liberation Mono", "monospace"]
      },
      boxShadow: {
        drawer: "-18px 0 55px rgba(0,0,0,.34)"
      },
      keyframes: {
        enter: { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideIn: { "0%": { opacity: "0", transform: "translateX(28px)" }, "100%": { opacity: "1", transform: "translateX(0)" } }
      },
      animation: {
        enter: "enter .42s cubic-bezier(.16,1,.3,1) both",
        slideIn: "slideIn .32s cubic-bezier(.16,1,.3,1) both"
      }
    }
  },
  plugins: []
};
