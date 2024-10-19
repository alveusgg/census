const theme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', 'class'],
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html', './node_modules/@critter/react/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', ...theme.fontFamily.sans]
      },
      colors: {
        accent: {
          50: 'rgba(var(--accent-color-50) / <alpha-value>)',
          100: 'rgba(var(--accent-color-100) / <alpha-value>)',
          200: 'rgba(var(--accent-color-200) / <alpha-value>)',
          300: 'rgba(var(--accent-color-300) / <alpha-value>)',
          400: 'rgba(var(--accent-color-400) / <alpha-value>)',
          500: 'rgba(var(--accent-color-500) / <alpha-value>)',
          600: 'rgba(var(--accent-color-600) / <alpha-value>)',
          700: 'rgba(var(--accent-color-700) / <alpha-value>)',
          800: 'rgba(var(--accent-color-800) / <alpha-value>)',
          900: 'rgba(var(--accent-color-900) / <alpha-value>)',
          950: 'rgba(var(--accent-color-950) / <alpha-value>)',
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [
    require('tailwind-scrollbar'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
    require('@tailwindcss/container-queries')
  ]
};
