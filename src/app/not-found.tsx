import React from 'react';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white">
            <div className="bg-zinc-900 p-10 shadow-2xl max-w-lg w-full text-center border-2 border-white/10">
                <h1 className="text-8xl font-extrabold mb-2 animate-pulse">404</h1>
                <h2 className="text-3xl font-bold mb-4">Oops! Lost in the void?</h2>
                <p className="text-zinc-300 mb-8 text-lg">
                    Looks like you took a wrong turn <br /> like our runners on a Cloka run.<br />
                    This page is as empty as your DMs.
                </p>

                <div className="mt-8 text-zinc-500 text-sm italic">
                    &quot;Knowledge is to know tomato is a fruit; <br /> Wisdom is to know not to put it in a fruit salad.&quot;
                </div>
                <div className="mt-2 text-zinc-500 text-xs">
                    - someone on the internet
                </div>


                <Link href="/" className="underline mt-10 hover:cursor-pointer px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    Go Home
                </Link>
            </div>
        </div>
    );
} 