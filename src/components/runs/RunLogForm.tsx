'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/Button';
import { MapPinIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const runSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  distance: z.number().min(0.1, 'Distance must be at least 0.1 km').max(200, 'Distance is too long'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  date: z.string().min(1, 'Date is required'),
  route: z.string().optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  location: z.object({
    name: z.string().optional(),
    coordinates: z.object({
      lat: z.number().optional(),
      lng: z.number().optional()
    }).optional()
  }).optional(),
  weather: z.object({
    temperature: z.number().optional(),
    condition: z.string().optional()
  }).optional(),
  elevationGain: z.number().min(0).optional(),
  calories: z.number().min(0).optional(),
  averageHeartRate: z.number().min(40).max(220).optional(),
  isPublic: z.boolean(),
  tags: z.array(z.string()),
});

type RunFormData = z.infer<typeof runSchema>;

interface RunLogFormProps {
  onSuccess?: (run: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export default function RunLogForm({ onSuccess, onCancel }: RunLogFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [newAchievements, setNewAchievements] = useState<Record<string, unknown>[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RunFormData>({
    resolver: zodResolver(runSchema),
    defaultValues: {
      title: '',
      distance: 0,
      duration: 0,
      date: new Date().toISOString().split('T')[0],
      route: '',
      notes: '',
      isPublic: true,
      tags: [],
      location: { name: 'Kanpur, India' }
    }
  });

  const distance = watch('distance');
  const duration = watch('duration');

  // Calculate pace automatically
  const pace = distance && duration ? (duration / distance).toFixed(2) : '0.00';

  const onSubmit = async (data: RunFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          distance: Number(data.distance),
          duration: Number(data.duration),
          elevationGain: data.elevationGain ? Number(data.elevationGain) : 0,
          calories: data.calories ? Number(data.calories) : null,
          averageHeartRate: data.averageHeartRate ? Number(data.averageHeartRate) : null,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.data.newAchievements?.length > 0) {
          setNewAchievements(result.data.newAchievements);
        }
        
        if (onSuccess) {
          onSuccess(result.data.run);
        } else {
          router.push('/runs');
        }
      } else {
        setError(result.message || 'Failed to log run');
      }
    } catch (err) {
      console.error('Error logging run:', err);
      setError('An error occurred while logging your run');
    } finally {
      setIsLoading(false);
    }
  };

  if (newAchievements.length > 0) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-green-600 mb-4">🎉 New Achievements!</h3>
          <div className="space-y-4">
            {newAchievements.map((achievement, index) => (
              <div key={index} className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-lg">
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <h4 className="font-bold text-lg">{achievement.name}</h4>
                <p className="text-sm text-gray-600">{achievement.nameHindi}</p>
                <p className="text-sm mt-2">{achievement.description}</p>
                <div className="flex justify-center items-center mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    achievement.rarity === 'legendary' ? 'bg-purple-200 text-purple-800' :
                    achievement.rarity === 'epic' ? 'bg-orange-200 text-orange-800' :
                    achievement.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                    achievement.rarity === 'uncommon' ? 'bg-green-200 text-green-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {achievement.rarity} • {achievement.points} points
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Button 
            onClick={() => router.push('/runs')} 
            className="mt-6"
            variant="primary"
          >
            View My Runs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Log Your Run / अपनी दौड़ दर्ज करें
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Run Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Run Title / दौड़ का नाम *
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="e.g., Morning run in Kanpur"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date / दिनांक *
            </label>
            <input
              {...register('date')}
              type="date"
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.date && (
              <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>
        </div>

        {/* Distance and Duration */}
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distance (km) / दूरी *
            </label>
            <input
              {...register('distance', { valueAsNumber: true })}
              type="number"
              step="0.1"
              min="0.1"
              placeholder="5.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.distance && (
              <p className="text-red-600 text-sm mt-1">{errors.distance.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes) / समय *
            </label>
            <input
              {...register('duration', { valueAsNumber: true })}
              type="number"
              min="1"
              placeholder="30"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.duration && (
              <p className="text-red-600 text-sm mt-1">{errors.duration.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pace (min/km) / गति
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
              {pace}
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPinIcon className="w-4 h-4 inline mr-1" />
            Location / स्थान
          </label>
          <input
            {...register('location.name')}
            type="text"
            placeholder="e.g., Green Park, Kanpur"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Optional Fields */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route / मार्ग
            </label>
            <input
              {...register('route')}
              type="text"
              placeholder="e.g., Park loop"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Elevation Gain (m) / ऊंचाई
            </label>
            <input
              {...register('elevationGain', { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calories Burned / कैलोरी
            </label>
            <input
              {...register('calories', { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="300"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Average Heart Rate / हृदय गति
            </label>
            <input
              {...register('averageHeartRate', { valueAsNumber: true })}
              type="number"
              min="40"
              max="220"
              placeholder="150"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes / टिप्पणियां
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="How did your run feel? Any thoughts or observations?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Privacy */}
        <div className="flex items-center">
          <input
            {...register('isPublic')}
            type="checkbox"
            id="isPublic"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
            Make this run public (visible to other runners) / इस दौड़ को सार्वजनिक करें
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex space-x-4 pt-4">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : null}
            Log Run / दौड़ दर्ज करें
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel / रद्द करें
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}