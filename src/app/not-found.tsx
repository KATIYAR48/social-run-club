import React from 'react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white">
            <div className="bg-zinc-900 p-10 shadow-2xl max-w-lg w-full text-center border-2 border-white/10">
                <h1 className="text-8xl font-extrabold mb-2 animate-pulse">404</h1>
                <h2 className="text-3xl font-bold mb-4">Oops! Lost in the void?</h2>
                <p className="text-zinc-300 mb-8 text-lg">
                    Looks like you took a wrong turn <br /> like our runners on a Cloka run.<br />
                    This page is as empty as your coffee cup ifykyk.
                </p>

                <div className="mt-8 text-zinc-500 text-sm italic">
                    &quot;Knowledge is to know tomato is a fruit; <br /> Wisdom is to know tomato is to know not to put it in a fruit salad.&quot;
                </div>
                <div className="mt-2 text-zinc-500 text-xs">
                    - sommene on the internet
                </div>
            </div>
        </div>
    );
} 