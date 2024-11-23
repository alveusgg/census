import theme from 'tailwindcss/defaultTheme';

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

      cursor: {
        ['editor-#5383E3']: `url('/editor-cursor-5383E3.svg') 8 6, pointer`,
        ['editor-#CB5DE7']: `url('/editor-cursor-CB5DE7.svg') 8 6, pointer`,
        ['editor-#E15D5D']: `url('/editor-cursor-E15D5D.svg') 8 6, pointer`,
        ['editor-#E79446']: `url('/editor-cursor-E79446.svg') 8 6, pointer`,
        ['editor-#9FB035']: `url('/editor-cursor-9FB035.svg') 8 6, pointer`,
        ['editor-#37AD6D']: `url('/editor-cursor-37AD6D.svg') 8 6, pointer`,
        ['editor-#39A0B6']: `url('/editor-cursor-39A0B6.svg') 8 6, pointer`
      },
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
