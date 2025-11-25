import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '7': 'var(--space-7)',
        '8': 'var(--space-8)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        'h1': '2rem',
        'h2': '1.5rem', 
        'body': '1rem',
        'small': '0.875rem',
        'display': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)', fontWeight: 'var(--font-bold)' }],
        'title': ['var(--text-xl)', { lineHeight: 'var(--leading-tight)', fontWeight: 'var(--font-semibold)' }],
        'subtitle': ['var(--text-lg)', { lineHeight: 'var(--leading-normal)', fontWeight: 'var(--font-semibold)' }],
        'body-lg': ['var(--text-base)', { lineHeight: 'var(--leading-normal)', fontWeight: 'var(--font-normal)' }],
        'meta': ['var(--text-sm)', { lineHeight: 'var(--leading-normal)', fontWeight: 'var(--font-normal)' }],
        'caption': ['var(--text-xs)', { lineHeight: 'var(--leading-normal)', fontWeight: 'var(--font-normal)' }],
      },
      colors: {
        'contrast': 'hsl(var(--color-neutral-100))',
        'tp-primary': 'hsl(var(--tp-primary))',
        'tp-accent': 'hsl(var(--tp-accent))',
        'tp-page-bg': 'hsl(var(--tp-page-bg))',
        'tp-card': 'hsl(var(--tp-card-surface))',
        'tp-text-primary': 'hsl(var(--tp-text-primary))',
        'tp-text-secondary': 'hsl(var(--tp-text-secondary))',
        'status-success': {
          50: 'hsl(var(--color-success-50))',
          100: 'hsl(var(--color-success-100))',
          500: 'hsl(var(--color-success-500))',
          600: 'hsl(var(--color-success-600))',
          700: 'hsl(var(--color-success-700))',
        },
        'status-warning': {
          50: 'hsl(var(--color-warning-50))',
          100: 'hsl(var(--color-warning-100))',
          500: 'hsl(var(--color-warning-500))',
          600: 'hsl(var(--color-warning-600))',
          700: 'hsl(var(--color-warning-700))',
        },
        'status-danger': {
          50: 'hsl(var(--color-danger-50))',
          100: 'hsl(var(--color-danger-100))',
          500: 'hsl(var(--color-danger-500))',
          600: 'hsl(var(--color-danger-600))',
          700: 'hsl(var(--color-danger-700))',
        },
        'status-info': {
          50: 'hsl(var(--color-info-50))',
          100: 'hsl(var(--color-info-100))',
          500: 'hsl(var(--color-info-500))',
          600: 'hsl(var(--color-info-600))',
          700: 'hsl(var(--color-info-700))',
        },
        'semantic-primary': {
          50: 'hsl(var(--color-primary-50))',
          100: 'hsl(var(--color-primary-100))',
          500: 'hsl(var(--color-primary-500))',
          600: 'hsl(var(--color-primary-600))',
          700: 'hsl(var(--color-primary-700))',
          900: 'hsl(var(--color-primary-900))',
        },
        'neutral': {
          50: 'hsl(var(--color-neutral-50))',
          100: 'hsl(var(--color-neutral-100))',
          200: 'hsl(var(--color-neutral-200))',
          300: 'hsl(var(--color-neutral-300))',
          400: 'hsl(var(--color-neutral-400))',
          500: 'hsl(var(--color-neutral-500))',
          600: 'hsl(var(--color-neutral-600))',
          700: 'hsl(var(--color-neutral-700))',
          800: 'hsl(var(--color-neutral-800))',
          900: 'hsl(var(--color-neutral-900))',
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--tp-primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--tp-accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
