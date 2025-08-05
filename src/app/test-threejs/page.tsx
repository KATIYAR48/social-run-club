'use client';

import { useState } from 'react';
import ThreeJsRunner from '@/components/ThreeJsRunner';

export default function TestThreeJsPage() {
    const [gender, setGender] = useState<'male' | 'female'>('male');

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Three.js Component Test</h1>

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Select Gender:</label>
                    <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                        className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2"
                    >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Three.js Component</h2>
                        <ThreeJsRunner gender={gender} />
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-4">Fallback Display</h2>
                        <div className="h-64 w-64 bg-black rounded-lg overflow-hidden border border-zinc-800 relative flex items-center justify-center">
                            <div className="text-center text-white">
                                <div className="text-6xl mb-2">{gender === 'male' ? '🏃‍♂️' : '🏃‍♀️'}</div>
                                <p className="text-sm text-zinc-400">Fallback Model</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-zinc-900 rounded border border-zinc-800">
                    <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
                    <p className="text-sm text-zinc-400">
                        This page tests the Three.js component in isolation. If the Three.js component
                        shows a black screen but the fallback displays correctly, the issue is with
                        the FBX model loading or Three.js initialization.
                    </p>
                </div>
            </div>
        </div>
    );
} 