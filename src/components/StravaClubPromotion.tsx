'use client';

import { motion } from 'framer-motion';
import Button from './Button';
import ThreeJsRunner from '@/components/ThreeJsRunner';
import Image from 'next/image';

const StravaClubPromotion = () => {
    return (
        <section className="bg-black text-white py-20">
            <div className="luxury-container">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center justify-start md:[&>*:first-child]:col-start-3 md:[&>*:last-child]:col-start-1 md:[&>*]:row-start-1">
                    <div className="md:col-span-1 filter saturate-20 contrast-150 flex justify-center">
                        <ThreeJsRunner
                            username={"fabianferno"}
                            gender={"male"}
                            chosenThemeColor={"#ff8800"}
                            className={'md:h-120 md:w-120 h-80 w-80'}
                        />
                    </div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="md:col-span-2"
                    >
                        <div className="flex items-center mb-6">
                            <h2 className="text-3xl md:text-4xl font-light text-white">
                                Join the Club on Strava
                            </h2>
                        </div>

                        <p className="luxury-text text-lg mb-6 text-zinc-300 leading-relaxed">
                            Connect with fellow runners, track your progress, and stay motivated with our vibrant Strava community. Share your runs, celebrate achievements, and find your next running buddy.
                        </p>

                        <div className="space-y-4 mb-8">
                            <div className='flex justify-center md:justify-start'>
                                <Button
                                    href="https://strava.app.link/bASEQLdAaWb"
                                    size="medium"
                                    variant="luxury"
                                    isExternal={true}
                                    className="px-2 mt-8 bg-[#fc4c02] py-4 flex max-w-fit justify-center items-center text-md font-bold"
                                >
                                    <Image className="w-12 h-12 mr-2" src={'/strava-logo.svg'} alt='Strava Logo' width={24} height={24} />
                                    <span>Join on Strava</span>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default StravaClubPromotion;
