# Clinical Appointment Platform - Frontend

React 18.2 + TypeScript + Vite frontend application for the Clinical Appointment and Intelligence Platform.

## 📋 Prerequisites

- **Node.js**: >= 20.0.0
- **npm**: >= 9.0.0

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Development

```bash
# Start development server (http://localhost:3000)
npm run dev
```

The development server includes:
- Hot Module Replacement (HMR)
- API proxy to backend (port 3001)
- TypeScript type checking
- ESLint integration

### Production Build

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

## 📁 Project Structure

```
app/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page components (routes)
│   ├── services/         # API services and business logic
│   │   └── api.ts        # Axios instance with interceptors
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # React Context providers
│   ├── assets/           # Static assets (images, fonts, etc.)
│   ├── App.tsx           # Root component with routing
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── public/               # Static public assets
├── dist/                 # Production build output (generated)
├── .env.example          # Environment variables template
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint configuration
└── .prettierrc           # Prettier configuration
```

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint checks |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run type-check` | Run TypeScript compiler checks |

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```env
# Backend API URL
VITE_API_URL=http://localhost:3001/api

# Base path for IIS deployment
VITE_BASE_PATH=/

# Application settings
VITE_APP_NAME=Clinical Appointment Platform
VITE_APP_VERSION=1.0.0
```

### Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
// Instead of: import Button from '../../../components/Button'
import Button from '@components/Button';

// Available aliases:
'@/*'           → './src/*'
'@components/*' → './src/components/*'
'@pages/*'      → './src/pages/*'
'@services/*'   → './src/services/*'
'@utils/*'      → './src/utils/*'
'@types/*'      → './src/types/*'
'@hooks/*'      → './src/hooks/*'
'@contexts/*'   → './src/contexts/*'
'@assets/*'     → './src/assets/*'
```

### IIS Deployment Support

The application supports deployment to IIS with custom base paths:

1. Set `VITE_BASE_PATH` in your `.env` file (e.g., `/my-app/`)
2. Build the application: `npm run build`
3. Deploy the `dist/` folder to IIS
4. Configure IIS to serve the application at the specified path

## 🎨 Code Style

### ESLint

The project uses ESLint with TypeScript and React best practices:
- TypeScript ESLint rules
- React Hooks rules
- Code complexity limits
- No-console warnings

### Prettier

Code formatting is enforced with Prettier:
- 2-space indentation
- Single quotes
- Trailing commas
- 100-character line width

## 🔧 Troubleshooting

### Node Version Error

If you see a Node version error, ensure you're using Node >= 20.0.0:

```bash
node --version  # Should be v20.0.0 or higher
```

### Port 3000 Already in Use

If port 3000 is occupied:

```bash
# Kill the process using port 3000 (Windows)
npx kill-port 3000

# Or specify a different port
VITE_PORT=3001 npm run dev
```

### Build Errors

If the production build fails:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Type check
npm run type-check

# Lint check
npm run lint
```

## 📚 Technology Stack

- **React** 18.2+ - UI library
- **TypeScript** 5.3+ - Type safety
- **Vite** 5.x - Build tool and dev server
- **React Router** 6.x - Client-side routing
- **Axios** - HTTP client
- **ESLint** - Code linting
- **Prettier** - Code formatting

## ♿ Accessibility

[![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2%20AA-green)](https://www.w3.org/WAI/WCAG22/quickref/)

This platform conforms to **WCAG 2.2 Level AA** standards.

- [Accessibility Statement](../.propel/docs/accessibility-statement.md)
- [Testing Guide](docs/accessibility-testing-guide.md)
- [Testing Results](docs/accessibility-testing-results.md)
- [Wave Validation Report](docs/wave-validation-report.md)
- [Color Contrast Report](docs/color-contrast-report.md)
- [Best Practices](docs/accessibility-best-practices.md)

## 🔗 Related Documentation

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Router Documentation](https://reactrouter.com/)

## 📝 License

Internal use only - Clinical Appointment Platform

import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
