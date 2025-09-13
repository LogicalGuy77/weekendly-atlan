# Weekendly

Planning the perfect weekend shouldn't be stressful. Weekendly is a modern web app that makes it easy to organize your weekend activities with a simple drag-and-drop interface, real-time weather insights, and the ability to share your plans as beautiful AI-generated images.

## What You Can Do

### Plan Your Weekend

- **Drag and Drop Activities**: Browse through 60+ activities and simply drag them into your weekend schedule
- **Smart Time Slots**: Organize your weekend into morning, afternoon, evening, and night periods
- **Activity Categories**: Choose from food & dining, outdoor adventures, entertainment, wellness, social activities, creative pursuits, learning experiences, and home projects
- **Conflict Detection**: The app automatically spots scheduling conflicts and lets you know

### Get Weather-Smart Recommendations

- **Real-time Weather**: See current conditions and 7-day forecasts using OpenMeteo data
- **Weather-Based Suggestions**: Get activity recommendations that match the weather - indoor activities when it's raining, outdoor fun when it's sunny
- **Location Awareness**: Uses your location to provide accurate local weather data

### Discover Nearby Places

- **Find Local Spots**: Discover nearby restaurants, attractions, parks, museums, shopping centers, and entertainment venues using Google Places
- **Weather-Filtered Results**: See places that make sense for the current weather conditions
- **Detailed Information**: View ratings, opening hours, and user reviews
- **Easy Navigation**: Get directions to any place with one click

### Share Your Plans

- **AI-Generated Images**: Create beautiful, shareable images of your weekend schedule using Google's Gemini AI
- **Multiple Styles**: Choose from 5 different visual styles - elegant, fun, minimalist, energetic, or cozy
- **Custom Messages**: Add personal touches to your shared images
- **Easy Sharing**: Download images or copy them directly to your clipboard

### Works Everywhere

- **Mobile-Friendly**: Fully responsive design that works great on phones and tablets
- **Offline Support**: Keep planning even when you lose internet connection
- **Progressive Web App**: Install it on your device like a native app
- **Dark/Light Themes**: Choose the theme that works best for you

## How It Works

The app calculates a "vibe score" for your weekend based on the balance of high, medium, and low energy activities, the variety of moods you've planned for, and how well your activities match the weather. It's a fun way to see if you've created a well-rounded weekend.

You can filter activities by category, mood, energy level, duration, weather dependency, and tags. The search function looks through activity titles, descriptions, and tags to help you find exactly what you're looking for.

## Built With

- **React 19** with TypeScript for a modern, type-safe experience
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for beautiful, responsive styling
- **Zustand** for simple state management
- **@dnd-kit** for smooth drag-and-drop interactions
- **Framer Motion** for delightful animations
- **IndexedDB** for reliable offline data storage

## Getting Started

### Setup

```bash
# Get the code
git clone <repository-url>
cd weekendly

# Install dependencies
npm install

# Set up your API keys
# Add your Google Gemini and Places API keys to the .env file

# Start the development server
npm run dev
```

### Environment Variables

You'll need to add these to your `.env` file:

```env
VITE_GOOGLE_NANO_BANANA_API_KEY=your_gemini_api_key_here
VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

### Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate test coverage report
```

## Testing

The project includes comprehensive tests for the activity store, covering state management, filtering, search functionality, and error handling. The test suite uses Vitest and includes over 25 test cases that verify everything from basic state operations to complex filtering scenarios.

## Privacy

Your data stays on your device. We don't track you or collect personal information. All your weekend plans are stored locally using IndexedDB, and the app works completely offline once loaded.

---

Made with care for people who love making the most of their weekends ✨
