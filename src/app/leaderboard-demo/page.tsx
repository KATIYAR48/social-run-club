'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import { TrophyIcon, FireIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/solid';

interface LeaderboardEntry {
  userId: string;
  name: string;
  username: string;
  profileImage?: string;
  totalDistance?: number;
  totalRuns?: number;
  bestPace?: number;
  averagePace?: number;
  consistencyScore?: number;
  uniqueDays?: number;
}

// Demo data for different categories
const demoData = {
  distance: [
    { userId: '1', name: 'राज कुमार', username: 'raj_runner', totalDistance: 45.2, totalRuns: 8 },
    { userId: '2', name: 'प्रिया शर्मा', username: 'priya_runs', totalDistance: 38.7, totalRuns: 6 },
    { userId: '3', name: 'अमित वर्मा', username: 'amit_marathoner', totalDistance: 35.1, totalRuns: 5 },
    { userId: '4', name: 'सुनीता गुप्ता', username: 'sunita_fast', totalDistance: 32.8, totalRuns: 7 },
    { userId: '5', name: 'विकास सिंह', username: 'vikas_runner', totalDistance: 29.4, totalRuns: 4 },
    { userId: '6', name: 'अनिता मिश्रा', username: 'anita_runs', totalDistance: 27.6, totalRuns: 6 },
    { userId: '7', name: 'संजय कुमार', username: 'sanjay_speedy', totalDistance: 25.3, totalRuns: 5 },
    { userId: '8', name: 'रीता जैन', username: 'rita_runner', totalDistance: 23.8, totalRuns: 4 }
  ],
  pace: [
    { userId: '4', name: 'सुनीता गुप्ता', username: 'sunita_fast', bestPace: 4.45, totalDistance: 32.8, totalRuns: 7 },
    { userId: '3', name: 'अमित वर्मा', username: 'amit_marathoner', bestPace: 4.52, totalDistance: 35.1, totalRuns: 5 },
    { userId: '7', name: 'संजय कुमार', username: 'sanjay_speedy', bestPace: 4.58, totalDistance: 25.3, totalRuns: 5 },
    { userId: '1', name: 'राज कुमार', username: 'raj_runner', bestPace: 5.02, totalDistance: 45.2, totalRuns: 8 },
    { userId: '5', name: 'विकास सिंह', username: 'vikas_runner', bestPace: 5.15, totalDistance: 29.4, totalRuns: 4 },
    { userId: '2', name: 'प्रिया शर्मा', username: 'priya_runs', bestPace: 5.23, totalDistance: 38.7, totalRuns: 6 },
    { userId: '6', name: 'अनिता मिश्रा', username: 'anita_runs', bestPace: 5.35, totalDistance: 27.6, totalRuns: 6 },
    { userId: '8', name: 'रीता जैन', username: 'rita_runner', bestPace: 5.42, totalDistance: 23.8, totalRuns: 4 }
  ],
  runs: [
    { userId: '1', name: 'राज कुमार', username: 'raj_runner', totalRuns: 8, totalDistance: 45.2 },
    { userId: '4', name: 'सुनीता गुप्ता', username: 'sunita_fast', totalRuns: 7, totalDistance: 32.8 },
    { userId: '2', name: 'प्रिया शर्मा', username: 'priya_runs', totalRuns: 6, totalDistance: 38.7 },
    { userId: '6', name: 'अनिता मिश्रा', username: 'anita_runs', totalRuns: 6, totalDistance: 27.6 },
    { userId: '3', name: 'अमित वर्मा', username: 'amit_marathoner', totalRuns: 5, totalDistance: 35.1 },
    { userId: '7', name: 'संजय कुमार', username: 'sanjay_speedy', totalRuns: 5, totalDistance: 25.3 },
    { userId: '5', name: 'विकास सिंह', username: 'vikas_runner', totalRuns: 4, totalDistance: 29.4 },
    { userId: '8', name: 'रीता जैन', username: 'rita_runner', totalRuns: 4, totalDistance: 23.8 }
  ],
  consistency: [
    { userId: '2', name: 'प्रिया शर्मा', username: 'priya_runs', consistencyScore: 95, uniqueDays: 6, totalRuns: 6 },
    { userId: '6', name: 'अनिता मिश्रा', username: 'anita_runs', consistencyScore: 92, uniqueDays: 5, totalRuns: 6 },
    { userId: '1', name: 'राज कुमार', username: 'raj_runner', consistencyScore: 88, uniqueDays: 7, totalRuns: 8 },
    { userId: '4', name: 'सुनीता गुप्ता', username: 'sunita_fast', consistencyScore: 85, uniqueDays: 6, totalRuns: 7 },
    { userId: '7', name: 'संजय कुमार', username: 'sanjay_speedy', consistencyScore: 80, uniqueDays: 4, totalRuns: 5 },
    { userId: '5', name: 'विकास सिंह', username: 'vikas_runner', consistencyScore: 75, uniqueDays: 3, totalRuns: 4 },
    { userId: '3', name: 'अमित वर्मा', username: 'amit_marathoner', consistencyScore: 70, uniqueDays: 3, totalRuns: 5 },
    { userId: '8', name: 'रीता जैन', username: 'rita_runner', consistencyScore: 65, uniqueDays: 2, totalRuns: 4 }
  ]
};

const categoryLabels = {
  distance: { en: 'Distance Leaders', hi: 'दूरी के नेता', icon: TrophyIcon, color: 'blue' },
  pace: { en: 'Speed Demons', hi: 'तेज़ धावक', icon: FireIcon, color: 'red' },
  runs: { en: 'Most Active', hi: 'सबसे सक्रिय', icon: CalendarIcon, color: 'green' },
  consistency: { en: 'Consistency Kings', hi: 'निरंतरता के राजा', icon: ClockIcon, color: 'purple' }
};

export default function LeaderboardDemoPage() {
  const [currentCategory, setCurrentCategory] = useState<'distance' | 'pace' | 'runs' | 'consistency'>('distance');

  const formatPace = (pace: number) => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `#${position + 1}`;
    }
  };

  const getStatValue = (entry: any) => {
    switch (currentCategory) {
      case 'distance':
        return `${entry.totalDistance} km`;
      case 'pace':
        return formatPace(entry.bestPace);
      case 'runs':
        return `${entry.totalRuns} runs`;
      case 'consistency':
        return `${entry.consistencyScore}%`;
      default:
        return '';
    }
  };

  const getSecondaryValue = (entry: any) => {
    switch (currentCategory) {
      case 'distance':
        return `${entry.totalRuns} runs`;
      case 'pace':
        return `${entry.totalDistance} km`;
      case 'runs':
        return `${entry.totalDistance} km`;
      case 'consistency':
        return `${entry.uniqueDays} days`;
      default:
        return '';
    }
  };

  const currentData = demoData[currentCategory];
  const currentLabel = categoryLabels[currentCategory];
  const IconComponent = currentLabel.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Demo Notice */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-2">🏆 सोशल Run Club - Leaderboard Demo</h2>
          <p className="text-purple-100">
            Complete leaderboard system with multiple categories and time periods for the Kanpur running community.
          </p>
          <p className="text-sm text-purple-200 mt-2">
            कानपुर रनिंग समुदाय के लिए कई श्रेणियों और समय अवधि के साथ पूर्ण लीडरबोर्ड प्रणाली।
          </p>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-full">
              <TrophyIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Leaderboards / लीडरबोर्ड
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
            See how you stack up against the Kanpur running community! Compete in different categories and climb to the top.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            देखें कि आप कानपुर रनिंग समुदाय के मुकाबले कैसे खड़े हैं! विभिन्न श्रेणियों में प्रतिस्पर्धा करें और शीर्ष पर पहुंचें।
          </p>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCurrentCategory(key as any)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                  currentCategory === key
                    ? `bg-${label.color}-600 text-white shadow-lg transform scale-105`
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                }`}
              >
                <label.icon className="w-5 h-5" />
                <div>
                  <div className="font-semibold">{label.en}</div>
                  <div className="text-xs opacity-80">{label.hi}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Leaderboard */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <IconComponent className={`w-6 h-6 mr-3 text-${currentLabel.color}-600`} />
                {currentLabel.en}
              </h3>
              <p className="text-gray-600 mt-1">{currentLabel.hi}</p>
              <p className="text-sm text-gray-500 mt-1">This Month • इस महीने</p>
            </div>
          </div>

          <div className="space-y-3">
            {currentData.map((entry, index) => (
              <div
                key={entry.userId}
                className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 hover:shadow-md ${
                  index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {/* Rank */}
                <div className="text-2xl font-bold w-12 text-center">
                  {getRankIcon(index)}
                </div>

                {/* Profile Image */}
                <div className="w-12 h-12 relative">
                  <div className={`w-12 h-12 bg-gradient-to-br from-${currentLabel.color}-500 to-${currentLabel.color}-600 rounded-full flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">
                      {entry.name.charAt(0)}
                    </span>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-900">{entry.name}</h4>
                  <p className="text-sm text-gray-600">@{entry.username}</p>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className={`font-bold text-xl text-${currentLabel.color}-600`}>
                    {getStatValue(entry)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getSecondaryValue(entry)}
                  </div>
                </div>

                {/* Badge for top 3 */}
                {index < 3 && (
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    index === 0 ? 'bg-yellow-200 text-yellow-800' :
                    index === 1 ? 'bg-gray-200 text-gray-800' :
                    'bg-orange-200 text-orange-800'
                  }`}>
                    {index === 0 ? 'CHAMPION' : index === 1 ? 'RUNNER-UP' : '3RD PLACE'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Category Explanations */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <div key={key} className={`bg-white rounded-lg p-6 shadow-md border-l-4 border-${label.color}-400`}>
              <div className="flex items-center mb-3">
                <label.icon className={`w-8 h-8 text-${label.color}-600 mr-3`} />
                <h4 className="font-bold text-gray-900">{label.en}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">{label.hi}</p>
              <p className="text-xs text-gray-500">
                {key === 'distance' && 'Total kilometers covered'}
                {key === 'pace' && 'Fastest recorded pace'}
                {key === 'runs' && 'Number of completed runs'}
                {key === 'consistency' && 'Regular running frequency'}
              </p>
            </div>
          ))}
        </div>

        {/* Achievement Info */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            🎯 How to Climb the Rankings
          </h3>
          <p className="text-gray-700 mb-6">
            रैंकिंग में कैसे चढ़ें
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-3xl mb-3">🏃‍♂️</div>
              <h4 className="font-semibold text-gray-900 mb-2">Run Regularly</h4>
              <p className="text-sm text-gray-600">Consistency is key to climbing the leaderboards</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-3xl mb-3">📈</div>
              <h4 className="font-semibold text-gray-900 mb-2">Track Progress</h4>
              <p className="text-sm text-gray-600">Log every run to see your improvement</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-3xl mb-3">👥</div>
              <h4 className="font-semibold text-gray-900 mb-2">Join Events</h4>
              <p className="text-sm text-gray-600">Participate in community runs</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="font-semibold text-gray-900 mb-2">Set Goals</h4>
              <p className="text-sm text-gray-600">Challenge yourself to improve</p>
            </div>
          </div>
          
          <div className="mt-8">
            <Button 
              onClick={() => window.location.href = '/runs-demo'}
              variant="primary"
              className="inline-flex items-center"
            >
              🏃‍♂️ Start Running & Climb the Board / दौड़ना शुरू करें
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}