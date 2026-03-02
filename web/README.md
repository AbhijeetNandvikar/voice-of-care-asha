# Voice of Care - Web Dashboard

React-based web dashboard for medical officers to monitor ASHA worker activities and generate reports.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Design System**: UX4G Design System v2.0.8 (Government standard)

## Project Structure

```
web/
├── src/
│   ├── components/     # Reusable React components
│   ├── pages/          # Page-level components
│   ├── services/       # API services and utilities
│   │   └── api.ts      # Axios instance with JWT interceptor
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts    # Common types (Worker, Beneficiary, Visit, etc.)
│   ├── utils/          # Utility functions
│   │   └── formatters.ts  # Date, phone, name formatters
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── public/             # Static assets
├── index.html          # HTML template with UX4G CDN
└── vite.config.ts      # Vite configuration
```

## Environment Variables

Create a `.env` file in the web directory:

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Features

- JWT-based authentication with automatic token injection
- Axios interceptors for request/response handling
- TypeScript for type safety
- UX4G Design System for government-compliant UI
- Modular project structure for scalability

## API Integration

The application uses an Axios instance configured in `src/services/api.ts` with:
- Base URL from environment variables
- Automatic JWT token injection from localStorage
- 401 error handling with automatic redirect to login
- 30-second request timeout

## Next Steps

Implement the following components as per the task list:
1. Authentication service and pages (Login, Signup)
2. Layout component with sidebar navigation
3. Dashboard with statistics and charts
4. Data management pages (Workers, Beneficiaries, Visits)
5. Sync logs monitoring
6. Data export functionality
7. Profile page
