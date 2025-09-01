# Lottery - React Native App

A clean and modern lottery application built with React Native and Expo, integrated with Supabase backend services.

## ✨ Features

### 🎯 Core Functionality

- **User Authentication** - Complete login/registration system
- **Number Selection** - Choose 9 lucky numbers from 1-10
- **Betting System** - Custom bet amounts with 9.8x payout
- **Real-time Countdown** - Live countdown for 5-minute draw intervals
- **History Tracking** - View bet history and draw results
- **Live Updates** - Real-time balance and result synchronization

### 🎨 Design Features

- **Modern Minimalist** - Clean black and white color scheme
- **Responsive Design** - Adapts to different screen sizes
- **Smooth Interactions** - Elegant user experience
- **Intuitive Interface** - Clear information hierarchy and workflow

## 🛠 Tech Stack

### Frontend

- **React Native** - Cross-platform mobile framework
- **Expo** - Development toolchain and runtime
- **TypeScript** - Type-safe JavaScript
- **Recoil** - State management library

### Backend

- **Supabase** - Backend-as-a-Service platform
- **PostgreSQL** - Database
- **Edge Functions** - Server-side logic
- **Real-time Subscriptions** - WebSocket connections

## 🚀 Quick Start

### Requirements

- Node.js 20.15.1+
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Installation

1. **Install dependencies**

```bash
npm install
```

2. **Start development server**

```bash
npm start
# or
npx expo start
```

3. **Run the app**
   - Use Expo Go app to scan QR code and run on device
   - Press `i` to run on iOS Simulator
   - Press `a` to run on Android Emulator
   - Press `w` to run on Web browser

### 🌐 Web Access

The application supports web browsers and can be accessed at:

**Local Development**: `http://localhost:19006`

**Web Features**:

- Responsive design for desktop and mobile browsers
- Touch and mouse input support
- Real-time hot reloading
- Browser developer tools integration
- Progressive Web App (PWA) capabilities

**Web Commands**:

```bash
# Start web development server
npm run web

# Or use Expo CLI directly
expo start --web
```

## 📁 Project Structure

```
rn-lottery/
├── app/                    # Application screens
│   ├── index.tsx          # Main screen
│   ├── auth.tsx           # Authentication screen
│   ├── history.tsx        # History screen
│   └── _layout.tsx        # Layout component
├── hooks/                  # Custom hooks
│   ├── useLottery.ts      # Lottery logic hook
│   └── useAuth.ts         # Authentication hook
├── lib/                    # Utility libraries
│   ├── supabase.ts        # Supabase configuration
│   └── api.ts             # API service layer
├── store/                  # State management
│   ├── atoms.ts           # Recoil atoms
│   └── selectors.ts       # Recoil selectors
└── assets/                 # Static assets
```

## 🎯 Game Rules

- **Number Selection**: Choose 9 unique numbers from 1-10
- **Bet Amount**: Minimum 1G, maximum 10000G
- **Draw Frequency**: Every 5 minutes
- **Winning Condition**: All 9 selected numbers match the drawn numbers
- **Payout Ratio**: 9.8x bet amount

## 🌐 Web Deployment (Cloudflare Pages)

### Quick Deploy to Cloudflare Pages

1. **Push to Git**: Ensure your code is pushed to GitHub/GitLab
2. **Login to Cloudflare**: Visit [dash.cloudflare.com](https://dash.cloudflare.com)
3. **Create Pages Project**: Connect your Git repository
4. **Configure Build**:
   - Build command: `npm run build:cloudflare`
   - Output directory: `dist`
   - Environment variables: Add your Supabase credentials

### Build Commands

```bash
# Build for Cloudflare Pages
npm run build:cloudflare

# Test build locally
npm run build:web-prod
```

### Features

- **Global CDN** - 200+ edge locations worldwide
- **Auto HTTPS** - Free SSL certificates
- **SPA Routing** - Single Page Application support
- **Performance** - Optimized caching and compression
- **Security** - Built-in DDoS protection

📖 **Detailed Guide**: See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for complete instructions

## 📱 Mobile Deployment (EAS)

### Prerequisites

Before deploying, ensure you have:

- **Expo Account** - Sign up at [expo.dev](https://expo.dev)
- **EAS CLI** - Expo Application Services command line tool
- **Git Repository** - Code should be committed to version control

### EAS Setup

1. **Install EAS CLI**

```bash
npm install -g eas-cli
```

2. **Login to Expo**

```bash
eas login
```

3. **Configure EAS Build**

```bash
eas build:configure
```

This will create an `eas.json` configuration file with build profiles:

- **development** - Development builds with debugging tools
- **preview** - Internal testing builds
- **production** - App store ready builds

### Building the App

#### Preview Build (Internal Testing)

```bash
# Android APK
eas build --platform android --profile preview

# iOS IPA (requires Apple Developer account)
eas build --platform ios --profile preview

# Both platforms
eas build --profile preview
```

#### Production Build (App Store)

```bash
# Android AAB for Google Play
eas build --platform android --profile production

# iOS for App Store
eas build --platform ios --profile production

# Both platforms
eas build --profile production
```

### Monitoring Builds

- **Check build status**

```bash
eas build:list
```

- **View build details**

```bash
eas build:view [BUILD_ID]
```

- **Build logs** are available at: `https://expo.dev/accounts/[USERNAME]/projects/[PROJECT]/builds/[BUILD_ID]`

### App Store Submission

#### Google Play Store

```bash
eas submit --platform android
```

#### Apple App Store

```bash
eas submit --platform ios
```

### Environment Configuration

Create environment-specific configurations in `eas.json`:

```json
{
	"build": {
		"preview": {
			"distribution": "internal",
			"env": {
				"EXPO_PUBLIC_SUPABASE_URL": "your-preview-supabase-url",
				"EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-preview-anon-key"
			}
		},
		"production": {
			"autoIncrement": true,
			"env": {
				"EXPO_PUBLIC_SUPABASE_URL": "your-production-supabase-url",
				"EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-production-anon-key"
			}
		}
	}
}
```

## 🔄 Updates & Maintenance

### Over-the-Air (OTA) Updates

For JavaScript-only changes (no native code changes):

1. **Publish update**

```bash
eas update --branch production --message "Bug fixes and improvements"

eas update:configure

eas update --branch production --message '0.0.1'

```

2. **Preview update**

```bash
eas update --branch preview --message "Testing new features"
```

### Version Management

#### Semantic Versioning

- **Patch** (1.0.1) - Bug fixes, minor changes
- **Minor** (1.1.0) - New features, backward compatible
- **Major** (2.0.0) - Breaking changes

#### Update app.json version

```json
{
	"expo": {
		"version": "1.0.1",
		"android": {
			"versionCode": 2
		},
		"ios": {
			"buildNumber": "2"
		}
	}
}
```

### Release Process

1. **Development**

   - Make changes and test locally
   - Commit changes to version control

2. **Preview Testing**

   - Build preview version: `eas build --profile preview`
   - Test with internal team
   - Fix any issues found

3. **Production Release**

   - Update version numbers in `app.json`
   - Build production version: `eas build --profile production`
   - Submit to app stores: `eas submit`

4. **Post-Release**
   - Monitor crash reports and user feedback
   - Use OTA updates for quick fixes
   - Plan next release cycle

### Rollback Strategy

If issues are found after release:

**OTA Rollback** (for JS-only issues)

```bash
eas update --branch production --message "Rollback to previous version"
```

**Binary Rollback** (for native issues)

- Revert to previous working commit
- Build and submit new version to app stores

### Monitoring & Analytics

- **Expo Analytics** - Built-in usage analytics
- **Crash Reporting** - Automatic crash detection
- **Performance Monitoring** - App performance metrics
- **User Feedback** - App store reviews and ratings

## �📄 License

This project is for educational and entertainment purposes only. Play responsibly.
