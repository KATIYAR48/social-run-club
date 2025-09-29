'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LeaderboardCard from '@/components/LeaderboardCard';
import { TrophyIcon } from '@heroicons/react/24/solid';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
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

        {/* Monthly Leaderboards */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            This Month&apos;s Champions / इस महीने के चैंपियन
          </h2>
          <div className="grid lg:grid-cols-2 gap-8">
            <LeaderboardCard 
              title="Distance Leaders"
              titleHindi="दूरी के नेता"
              category="distance" 
              period="month"
              limit={10}
              showFilters={false}
            />
            <LeaderboardCard 
              title="Speed Demons"
              titleHindi="तेज़ धावक"
              category="pace" 
              period="month"
              limit={10}
              showFilters={false}
            />
          </div>
        </div>

        {/* Weekly Leaderboards */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            This Week&apos;s Top Performers / इस सप्ताह के टॉप परफॉर्मर
          </h2>
          <div className="grid lg:grid-cols-2 gap-8">
            <LeaderboardCard 
              title="Most Active Runners"
              titleHindi="सबसे सक्रिय धावक"
              category="runs" 
              period="week"
              limit={10}
              showFilters={false}
            />
            <LeaderboardCard 
              title="Consistency Champions"
              titleHindi="निरंतरता के चैंपियन"
              category="consistency" 
              period="week"
              limit={10}
              showFilters={false}
            />
          </div>
        </div>

        {/* Interactive Leaderboard */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Explore All Rankings / सभी रैंकिंग देखें
          </h2>
          <div className="max-w-4xl mx-auto">
            <LeaderboardCard 
              category="distance" 
              period="month"
              limit={20}
              showFilters={true}
            />
          </div>
        </div>

        {/* Achievement Info */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            🏆 Climb the Rankings!
          </h3>
          <p className="text-lg text-gray-700 mb-4">
            Keep running consistently to improve your position on the leaderboards.
          </p>
          <p className="text-sm text-gray-600 mb-6">
            लगातार दौड़ते रहें और लीडरबोर्ड में अपनी स्थिति सुधारें।
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-3xl mb-2">🥇</div>
              <h4 className="font-semibold text-gray-900">Distance</h4>
              <p className="text-sm text-gray-600">Run the most kilometers</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-3xl mb-2">⚡</div>
              <h4 className="font-semibold text-gray-900">Speed</h4>
              <p className="text-sm text-gray-600">Achieve the fastest pace</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-3xl mb-2">🔥</div>
              <h4 className="font-semibold text-gray-900">Activity</h4>
              <p className="text-sm text-gray-600">Complete the most runs</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-3xl mb-2">📅</div>
              <h4 className="font-semibold text-gray-900">Consistency</h4>
              <p className="text-sm text-gray-600">Run regularly every week</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}