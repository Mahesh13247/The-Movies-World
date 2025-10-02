# Movie Finder - Setup Instructions

## Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

## Environment Setup

1. **Create Environment File**
   Create a `.env` file in the root directory with the following variables:

   ```env
   # TMDB API Configuration
   VITE_API_KEY=your_tmdb_api_key_here
   VITE_API_BASE_URL=https://api.themoviedb.org/3

   # Application Configuration
   VITE_APP_TITLE=Movie Finder
   VITE_APP_VERSION=1.0.0

   # Adult Content API (Optional)
   VITE_EPORNER_API_KEY=your_eporner_api_key_here
   ```

2. **Get TMDB API Key**
   - Go to [TMDB API](https://www.themoviedb.org/settings/api)
   - Create an account and request an API key
   - Copy the API key and replace `your_tmdb_api_key_here` in the `.env` file

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Features

- 🎬 Movie search and discovery
- 🌟 Trending movies carousel
- ❤️ Favorites and watchlist management
- 🌙 Dark/Light theme support
- 🌍 Multi-language support (English/Hindi)
- 📱 Responsive design
- 🔒 Adult content section with PIN protection
- 🎨 Theme customization
- 📊 Admin panel
- 📝 User reviews and ratings

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Ensure your TMDB API key is valid
   - Check if the API key has the correct permissions
   - Verify the `.env` file is in the correct location

2. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for any missing dependencies

3. **Local Storage Issues**
   - Clear browser cache and local storage
   - Check if you're running in incognito mode

## Development

- The app uses React 18 with Vite
- State management is handled with React Context
- Styling uses CSS modules and custom CSS
- Internationalization is handled with react-i18next

## Production Deployment

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Ensure environment variables are set in your hosting platform
