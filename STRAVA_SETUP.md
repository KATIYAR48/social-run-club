# Strava Integration Setup Guide

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```env
# Strava Integration
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

## Strava App Setup

1. Go to https://www.strava.com/settings/api
2. Create a new application
3. Set the Authorization Callback Domain to: `localhost` (for development)
4. Copy the Client ID and Client Secret to your environment variables

## Features Implemented

### 1. User Model Extension
- Extended User model with Strava integration fields
- Added StravaStats schema for storing running statistics
- Includes personal records, achievements, and streaks

### 2. OAuth Integration
- `/api/auth/strava/connect` - Initiates Strava OAuth flow
- `/api/auth/strava/callback` - Handles OAuth callback and token exchange
- Automatic token refresh functionality

### 3. Stats Management
- `/api/strava/refresh-stats` - Manually refresh user's Strava stats
- Automatic calculation of personal records (5K, 10K, Half Marathon, Marathon)
- Achievement system with distance and run count milestones
- Streak calculation for current and longest running streaks

### 4. Frontend Components
- `StravaStats` component displays gamified running statistics
- Integrated into user profile page (only visible to profile owner)
- Real-time stats refresh functionality
- Beautiful UI with achievements and personal records

## Usage

1. Users can connect their Strava account from their profile page
2. Once connected, their running stats will be automatically fetched and displayed
3. Users can manually refresh their stats using the "Refresh Stats" button
4. Achievements are automatically calculated based on running milestones

## Data Collected

- Personal Records (5K, 10K, Half Marathon, Marathon times)
- Current and longest running streaks
- Weekly, monthly, and yearly distance stats
- Total running statistics
- Achievement badges for milestones

## Security

- Strava tokens are securely stored in the database
- Automatic token refresh when expired
- OAuth flow follows security best practices
- User data is only accessible to the profile owner 