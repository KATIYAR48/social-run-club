'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import { 
  PlusIcon, 
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Run {
  _id: string;
  title: string;
  distance: number;
  duration: number;
  pace: number;
  date: string;
  location?: { name: string };
  notes?: string;
  isPublic: boolean;
  userId: {
    name: string;
    username: string;
    profileImage?: string;
  };
  createdAt: string;
}

// Demo data
const demoRuns: Run[] = [
  {
    _id: '1',
    title: 'Morning Run in Green Park',
    distance: 5.2,
    duration: 28,
    pace: 5.38,
    date: '2024-09-29',
    location: { name: 'Green Park, Kanpur' },
    notes: 'Great morning run! Weather was perfect.',
    isPublic: true,
    userId: {
      name: 'राज कुमार',
      username: 'raj_runner',
      profileImage: undefined
    },
    createdAt: '2024-09-29T06:30:00Z'
  },
  {
    _id: '2',
    title: 'Evening Jog by Ganga',
    distance: 3.8,
    duration: 22,
    pace: 5.79,
    date: '2024-09-28',
    location: { name: 'Ganga Ghat, Kanpur' },
    notes: 'Beautiful sunset run along the river.',
    isPublic: true,
    userId: {
      name: 'प्रिया शर्मा',
      username: 'priya_runs',
      profileImage: undefined
    },
    createdAt: '2024-09-28T18:15:00Z'
  },
  {
    _id: '3',
    title: '10K Training Run',
    distance: 10.1,
    duration: 52,
    pace: 5.15,
    date: '2024-09-27',
    location: { name: 'Phool Bagh, Kanpur' },
    notes: 'Personal best pace! Preparing for upcoming marathon.',
    isPublic: true,
    userId: {
      name: 'अमित वर्मा',
      username: 'amit_marathoner',
      profileImage: undefined
    },
    createdAt: '2024-09-27T07:00:00Z'
  }
];

const demoUserStats = {
  totalRuns: 24,
  totalDistance: 127.3,
  averagePace: 5.45,
  totalDuration: 694
};

const demoLeaderboard = [
  { rank: 1, name: 'राज कुमार', username: 'raj_runner', totalDistance: 45.2, totalRuns: 8 },
  { rank: 2, name: 'प्रिया शर्मा', username: 'priya_runs', totalDistance: 38.7, totalRuns: 6 },
  { rank: 3, name: 'अमित वर्मा', username: 'amit_marathoner', totalDistance: 35.1, totalRuns: 5 }
];

export default function RunsDemoPage() {
  const [activeTab, setActiveTab] = useState<'my-runs' | 'all-runs' | 'leaderboard'>('all-runs');
  const [showLogForm, setShowLogForm] = useState(false);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPace = (pace: number) => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (showLogForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Log Your Run / अपनी दौड़ दर्ज करें
            </h2>
            <div className="bg-blue-50 border border-blue-300 text-blue-700 px-4 py-3 rounded mb-6">
              <p className="font-semibold">🚀 Demo Mode</p>
              <p>This is a demo of the run logging interface. In the full application, you can log your runs with distance, time, pace, and location.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Run Title / दौड़ का नाम *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Morning run in Green Park"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance (km) / दूरी *
                  </label>
                  <input
                    type="number"
                    placeholder="5.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) / समय *
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex space-x-4">
              <Button variant="outline" onClick={() => setShowLogForm(false)}>
                Back to Runs / वापस
              </Button>
              <Button variant="primary" disabled>
                Log Run (Demo) / दर्ज करें
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Demo Notice */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-2">🚀 सोशल Run Club - Demo Mode</h2>
          <p className="text-blue-100">
            This is a demonstration of the run tracking, leaderboards, and social features for the Kanpur running community.
          </p>
          <p className="text-sm text-blue-200 mt-2">
            यह कानपुर रनिंग समुदाय के लिए रन ट्रैकिंग, लीडरबोर्ड और सामाजिक सुविधाओं का प्रदर्शन है।
          </p>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Run Tracking / दौड़ ट्रैकिंग
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Log your runs, track your progress, and compete with the Kanpur running community.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            अपनी दौड़ दर्ज करें, अपनी प्रगति ट्रैक करें, और कानपुर रनिंग समुदाय के साथ प्रतिस्पर्धा करें।
          </p>
          
          <Button
            onClick={() => setShowLogForm(true)}
            variant="primary"
            className="inline-flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Log a Run / दौड़ दर्ज करें (Demo)
          </Button>
        </div>

        {/* Demo User Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-blue-600">{demoUserStats.totalRuns}</div>
            <div className="text-sm text-gray-600">Total Runs / कुल दौड़</div>
          </div>
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-green-600">
              {demoUserStats.totalDistance.toFixed(1)} km
            </div>
            <div className="text-sm text-gray-600">Total Distance / कुल दूरी</div>
          </div>
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-purple-600">
              {formatPace(demoUserStats.averagePace)}
            </div>
            <div className="text-sm text-gray-600">Average Pace / औसत गति</div>
          </div>
          <div className="bg-white rounded-lg p-6 text-center shadow-lg">
            <div className="text-3xl font-bold text-orange-600">
              {formatDuration(demoUserStats.totalDuration)}
            </div>
            <div className="text-sm text-gray-600">Total Time / कुल समय</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('all-runs')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'all-runs'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Community Runs / समुदायिक दौड़
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Leaderboard / लीडरबोर्ड
          </button>
        </div>

        {/* Content */}
        {activeTab === 'leaderboard' ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              🏆 Distance Leaderboard - This Month
            </h3>
            <p className="text-sm text-gray-600 mb-6">दूरी लीडरबोर्ड - इस महीने</p>
            <div className="space-y-3">
              {demoLeaderboard.map((entry, index) => (
                <div
                  key={entry.username}
                  className={`flex items-center space-x-3 p-4 rounded-lg ${
                    index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-lg font-bold w-8 text-center">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {entry.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{entry.name}</h4>
                    <p className="text-sm text-gray-600">@{entry.username}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{entry.totalDistance} km</div>
                    <div className="text-xs text-gray-500">{entry.totalRuns} runs</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {demoRuns.map((run) => (
              <div key={run._id} className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {run.title}
                    </h3>
                    <div className="flex items-center text-gray-600 space-x-4 text-sm">
                      <span className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {formatDate(run.date)}
                      </span>
                      {run.location?.name && (
                        <span className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {run.location.name}
                        </span>
                      )}
                      <span className="flex items-center">
                        👤 {run.userId.name}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {run.distance.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">km</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatDuration(run.duration)}
                    </div>
                    <div className="text-sm text-gray-600">Duration</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatPace(run.pace)}
                    </div>
                    <div className="text-sm text-gray-600">Pace (min/km)</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {(run.distance / (run.duration / 60)).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Speed (km/h)</div>
                  </div>
                </div>

                {run.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Notes:</h4>
                    <p className="text-gray-700 text-sm">{run.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Feature Info */}
        <div className="mt-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            🏃‍♂️ Features Implemented / कार्यान्वित सुविधाएं
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-4 shadow-md text-center">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-semibold text-gray-900">Run Tracking</h4>
              <p className="text-sm text-gray-600">Distance, time, pace logging</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md text-center">
              <div className="text-3xl mb-2">🏆</div>
              <h4 className="font-semibold text-gray-900">Leaderboards</h4>
              <p className="text-sm text-gray-600">Community rankings</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-semibold text-gray-900">Achievements</h4>
              <p className="text-sm text-gray-600">Badges and milestones</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md text-center">
              <div className="text-3xl mb-2">👥</div>
              <h4 className="font-semibold text-gray-900">Social Feed</h4>
              <p className="text-sm text-gray-600">Community sharing</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link href="/leaderboard-demo" className="inline-block">
              <Button variant="primary">
                View Full Leaderboard Demo / पूर्ण लीडरबोर्ड देखें
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}