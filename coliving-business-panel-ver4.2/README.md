# Customer Service Dashboard

A comprehensive customer service dashboard for tenant management with sentiment analysis, emotion tracking, and agent performance monitoring.

## Features

- **Ticket Management**: View and manage customer service tickets with detailed information
- **Sentiment Analysis**: Track customer sentiment trends over time
- **Emotion Detection**: Monitor emotional patterns in customer interactions
- **Service Area Analytics**: Analyze performance across different service categories
- **Agent Performance**: Track and monitor agent assignments and performance
- **Interactive Charts**: Visualize data with responsive charts and graphs
- **Filtering & Search**: Advanced filtering options for better data management
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **UI Components**: Radix UI (ShadCN)
- **Build Tool**: Vite
- **Package Manager**: npm

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

1. Clone the repository OR Simply just download and go to the directory:
```bash
git clone https://github.com/yourusername/customer-service-dashboard.git

# OR

cd {the_file_path_where_u_put}
```

2. Install dependencies:
```bash
npm install
```

3. Modify in the main.tsx
```bash
# currently is 
import App from './App-test.tsx' # means using the pre-defined harcoded data

# u may change to 
import App from './App-test.tsx' # for hooking up to the API data

# Note: App.tsx is same as App-test.tsx
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

6. Terminate / Stop the browser simply just
```bash
q + Enter
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build directory

## Project Structure

```
├── components/          # React components
│   ├── ui/             # Reusable UI components (ShadCN)
│   └── ...             # Feature-specific components
├── lib/                # Utility functions and data
├── styles/             # CSS and styling files
├── App.tsx             # Main application component
└── main.tsx           # Application entry point
```

## Key Components

- **TicketTable**: Main ticket management interface
- **SentimentDistributionPlot**: Scatter plot showing sentiment over time
- **SentimentTrendOverTime**: Line chart tracking sentiment trends
- **EmotionDistribution**: Donut chart showing emotion proportions
- **SentimentByServiceArea**: Bar chart analyzing sentiment by service category
- **DashboardFilters**: Advanced filtering interface
- **AIChatAssistant**: AI-powered chat assistance

## Customization

The dashboard uses a comprehensive design system with customizable:
- Color schemes (light/dark mode support)
- Typography scales
- Component variants
- Chart themes

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.