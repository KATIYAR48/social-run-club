'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Button from './Button';

const Hero = () => {
    const [registrationCount, setRegistrationCount] = useState<number>(600);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchRegistrationCount = async () => {
            try {
                const response = await fetch('/api/user/count');
                if (response.ok) {
                    const data = await response.json();
                    setRegistrationCount(data.count);
                }
            } catch (error) {
                console.error('Error fetching registration count:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRegistrationCount();
    }, []);

    return (
        <section className="text-white">
            <div className="md:container md:mx-auto mx-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="text-center flex-col justify-center my-3 mx-8 md:mx-0">
                            <Image
                                src="/run-club.PNG"
                                alt="CLOKA Text"
                                width={400}
                                height={120}
                                className="invert"
                                priority
                            />
                            <Image
                                src="/beyondtheline.png"
                                alt="Beyond the Line Text"
                                width={300}
                                height={120}
                                className="invert mt-5"
                                priority
                            />
                        </div>
                        <p className="md:text-start text-center max-w-xl text-md mt-4 mb-8 text-zinc-300 !leading-6">
                            You’ve just found your crew. Your space to move, lift, sweat & push past limits.
                            This community meets you where you are and moves with you, every step and every rep.
                            &mdash;Cloka Sees You.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-start items-center gap-4">
                            <Button
                                href="/auth?mode=signup"
                                className="rounded-md hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] shadow-white gap-2 px-4 py-2 bg-zinc-800 hover:bg-white hover:text-black border border-zinc-700 hover:border-white inline-block text-center"
                            >
                                JOIN TODAY
                            </Button>
                            <div className="luxury-text text-md text-zinc-400 md:text-start text-center">
                                {isLoading ? (
                                    <span className="font-bold">1500+</span>
                                ) : (
                                    <motion.span
                                        className="text-white text-md font-sans font-bold"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        {registrationCount}+
                                    </motion.span>
                                )} runners already locked in,<div className='text-lg'>
                                    what about <span className='text-white font-bold'>you</span>?
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative hidden md:block rounded-lg h-[400px] md:h-[500px] overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent z-10 hidden md:block"></div>
                        <video
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                        >
                            <source src="/teaser.MP4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero; 