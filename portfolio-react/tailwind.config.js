/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // We'll define these as CSS variables to support light/dark mode easily
        'bg-base': 'var(--bg-base)',
        'bg-card': 'var(--bg-card)',
        'bg-card-hover': 'var(--bg-card-hover)',
        'bg-pill': 'var(--bg-pill)',
        'bg-section-alt': 'var(--bg-section-alt)',
        'border': 'var(--border)',
        'border-subtle': 'var(--border-subtle)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'accent': 'var(--accent)',
        'link': 'var(--link)',
        'link-hover': 'var(--link-hover)',
        'tag-bg': 'var(--tag-bg)',
        'tag-text': 'var(--tag-text)',
        'star-color': 'var(--star-color)',
        'badge-green': 'var(--badge-green)',
        'badge-green-t': 'var(--badge-green-t)',
        'badge-blue': 'var(--badge-blue)',
        'badge-blue-t': 'var(--badge-blue-t)',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}