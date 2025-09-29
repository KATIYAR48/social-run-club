'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RunLogForm from '@/components/runs/RunLogForm';
import LeaderboardCard from '@/components/LeaderboardCard';
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

export default function RunsPage() {
  const { user, isAuthenticated } = useAuth();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);
  const [userStats, setUserStats] = useState<Record<string, number> | null>(null);
  const [activeTab, setActiveTab] = useState<'my-runs' | 'all-runs' | 'leaderboard'>('my-runs');

  useEffect(() => {
    if (isAuthenticated) {
      fetchRuns();
      fetchUserStats();
    } else {
      fetchPublicRuns();
    }
  }, [isAuthenticated, user]);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const url = activeTab === 'my-runs' && user 
        ? `/api/runs?userId=${user._id}` 
        : '/api/runs';
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setRuns(result.data.runs);
      }
    } catch (error) {
      console.error('Error fetching runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicRuns = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/runs');
      const result = await response.json();
      
      if (result.success) {
        setRuns(result.data.runs);
      }
    } catch (error) {
      console.error('Error fetching public runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/runs/stats?userId=${user._id}`);
      const result = await response.json();
      
      if (result.success) {
        setUserStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

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

  if (showLogForm && isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <RunLogForm
            onSuccess={(run) => {
              setRuns(prev => [run, ...prev]);
              setShowLogForm(false);
              fetchUserStats(); // Refresh stats
            }}
            onCancel={() => setShowLogForm(false)}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
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
          
          {isAuthenticated ? (
            <Button
              onClick={() => setShowLogForm(true)}
              variant="primary"
              className="inline-flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Log a Run / दौड़ दर्ज करें
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600">Join the सोशल Run Club to start tracking your runs!</p>
              <Link href="/auth?mode=signup">
                <Button variant="primary">
                  Join Now / अभी शामिल हों
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* User Stats (for authenticated users) */}
        {isAuthenticated && userStats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-blue-600">{userStats.totalRuns || 0}</div>
              <div className="text-sm text-gray-600">Total Runs / कुल दौड़</div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-green-600">
                {(userStats.totalDistance || 0).toFixed(1)} km
              </div>
              <div className="text-sm text-gray-600">Total Distance / कुल दूरी</div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-purple-600">
                {formatPace(userStats.averagePace || 0)}
              </div>
              <div className="text-sm text-gray-600">Average Pace / औसत गति</div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-orange-600">
                {formatDuration(userStats.totalDuration || 0)}
              </div>
              <div className="text-sm text-gray-600">Total Time / कुल समय</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          {isAuthenticated && (
            <button
              onClick={() => {
                setActiveTab('my-runs');
                fetchRuns();
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'my-runs'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              My Runs / मेरी दौड़
            </button>
          )}
          <button
            onClick={() => {
              setActiveTab('all-runs');
              fetchPublicRuns();
            }}
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
          <div className="grid lg:grid-cols-2 gap-8">
            <LeaderboardCard category="distance" period="month" />
            <LeaderboardCard category="pace" period="month" />
            <LeaderboardCard category="runs" period="month" />
            <LeaderboardCard category="consistency" period="month" />
          </div>
        ) : (
          <div className="space-y-6">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-lg animate-pulse">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="h-6 bg-gray-300 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-32"></div>
                    </div>
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="h-12 bg-gray-300 rounded"></div>
                    ))}
                  </div>
                </div>
              ))
            ) : runs.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center shadow-lg">
                <div className="text-6xl mb-4">🏃‍♂️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {activeTab === 'my-runs' ? 'No runs logged yet!' : 'No runs found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'my-runs' 
                    ? 'Start your fitness journey by logging your first run!'
                    : 'Be the first to share your run with the community!'
                  }
                </p>
                {isAuthenticated && activeTab === 'my-runs' && (
                  <Button onClick={() => setShowLogForm(true)} variant="primary">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Log Your First Run
                  </Button>
                )}
              </div>
            ) : (
              runs.map((run) => (
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
                        {(run.distance / run.pace).toFixed(1)}
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
              ))
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}