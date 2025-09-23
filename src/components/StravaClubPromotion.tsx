'use client';

import { motion } from 'framer-motion';
import Button from './Button';
import ThreeJsRunner from '@/components/ThreeJsRunner';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordian';

const StravaClubPromotion = () => {
    return (
        <section className="rounded-xl border md:px-10 px-8 border-zinc-800 md:container md:mx-auto mx-5 text-white md:py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center justify-start md:[&>*:first-child]:col-start-3 md:[&>*:last-child]:col-start-1 md:[&>*]:row-start-1">
                <div className="md:col-span-1 -mb-10 flex justify-center">
                    <ThreeJsRunner
                        username={"fabianferno"}
                        gender={"male"}
                        chosenThemeColor={"#ffffff"}
                        className={'md:h-120 md:w-120 h-80 w-80 filter saturate-20 contrast-200  opacity-80'}
                    />
                </div>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="md:col-span-2 md:text-start text-center"
                >
                    <h2 className="text-lg mb-2 font-bold text-white">
                        Join the Club on Strava
                    </h2>

                    <p className="text-sm text-zinc-300 !leading-7">
                        Connect with fellow runners, track your progress, and stay motivated with our vibrant club.
                    </p>

                    {/* Accordion from shadcn/ui for "See stats" */}
                    <div className="">
                        <Accordion type="single" collapsible>
                            <AccordionItem value="strava-stats">
                                <AccordionTrigger className="cursor-pointer mx-10 md:mx-auto italic text-sm font-medium text-zinc-200 hover:text-white">
                                    {"> "} See club stats
                                </AccordionTrigger>
                                <AccordionContent>
                                    <iframe
                                        className='bg-black h-[160px] w-full'
                                        src='https://www.strava.com/clubs/1335275/latest-rides/2172b381d58307c4b3305514887dee45f97d39d0?show_rides=false'
                                        width='300'
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className='flex w-full justify-center md:justify-start'>
                            <Button
                                href="https://strava.app.link/bASEQLdAaWb"
                                size="medium"
                                isExternal={true}
                                className="rounded-md !px-3 w-full mt-2 bg-gradient-to-br from-zinc-700 to-zinc-900 !font-bold flex md:max-w-fit justify-center items-center transition-colors ease-in-out duration-300"
                            >
                                <Image className="w-10 h-10 mr-3" src={'/strava-logo.svg'} alt='Strava Logo' width={24} height={24} />
                                <span className='text-sm'>Join on Strava</span>
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default StravaClubPromotion;
