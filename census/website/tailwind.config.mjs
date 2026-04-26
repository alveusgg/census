import theme from 'tailwindcss/defaultTheme';
import { cursors } from './tailwind.cursors.mjs';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', 'class'],
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html', './node_modules/@critter/react/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', ...theme.fontFamily.sans],
        mono: ['Fira Code', ...theme.fontFamily.mono]
      },
      cursor: cursors,
      borderColor: {
        accent: {
          DEFAULT: '#D4C0AC'
        }
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
        custom: {
          DEFAULT: 'var(--custom-color)',
          darker: 'color-mix(in srgb, var(--custom-color) 85%, black)'
        },
        alveus: {
          DEFAULT: '#646A61',
          darker: '#535C4E'
        },
        leaderboard: {
          50: 'rgba(var(--leaderboard-color-50) / <alpha-value>)',
          100: 'rgba(var(--leaderboard-color-100) / <alpha-value>)',
          200: 'rgba(var(--leaderboard-color-200) / <alpha-value>)',
          300: 'rgba(var(--leaderboard-color-300) / <alpha-value>)',
          400: 'rgba(var(--leaderboard-color-400) / <alpha-value>)',
          500: 'rgba(var(--leaderboard-color-500) / <alpha-value>)',
          600: 'rgba(var(--leaderboard-color-600) / <alpha-value>)',
          700: 'rgba(var(--leaderboard-color-700) / <alpha-value>)',
          800: 'rgba(var(--leaderboard-color-800) / <alpha-value>)',
          900: 'rgba(var(--leaderboard-color-900) / <alpha-value>)',
          950: 'rgba(var(--leaderboard-color-950) / <alpha-value>)'
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
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
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
