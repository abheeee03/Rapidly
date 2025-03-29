# UptoDate News App

A modern news reading application built with React Native and Expo, featuring smooth article swiping, Firebase integration, and a beautiful UI.

## Features

- **Article Swiping**: Smooth horizontal swiping between articles using `react-native-pager-view`
- **Firebase Integration**: Real-time article fetching from Firestore database
- **Modern UI**: Clean, responsive design with theme support
- **Optimized Performance**: Efficient article loading and pagination
- **Error Handling**: Robust error and edge-case handling
- **Responsive Design**: Adapts to different screen sizes and orientations

## Tech Stack

- React Native / Expo
- Firebase (Firestore)
- React Navigation
- Expo Router
- React Native PagerView

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/uptodate-news.git
cd uptodate-news
```

2. Install dependencies
```
npm install
```

3. Set up Firebase
   - Create a Firebase project
   - Enable Firestore
   - Add your Firebase config to `Utlis/firebase.js`

4. Start the development server
```
npx expo start
```

## Building for Production

### Android

```
eas build -p android --profile production
```

### iOS

```
eas build -p ios --profile production
```

## Project Structure

- `app/` - Contains all the screens and navigation setup
  - `(tabs)/` - Tab-based screens (Articles, Videos, etc.)
  - `screens/` - Other screens like ArticleDetail
- `components/` - Reusable components (ArticleCard, etc.)
- `context/` - React context providers (ThemeContext, etc.)
- `Utlis/` - Utility functions and Firebase configuration

## Performance Optimizations

- Pagination with Firebase for efficient data loading
- Image loading optimization with loading states
- Limited render batches for smooth performance
- Error boundary implementations for production stability

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

- Design inspired by modern news applications
- Sample articles for demonstration purposes
