'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface FAQItem {
    question: string;
    answer: string;
}

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqData: FAQItem[] = [
        {
            question: "How do I register for Cloka Club events?",
            answer: "Just head over to cloka.in, pick the event that's scheduled for the week, and hit that \"Register\" button. Once we approve your registration, you'll get a confirmation email. Boom, you're in!"
        },
        {
            question: "Do I have to pay an entry fee to join the run?",
            answer: "Nope. Cloka runs are always free to join. If there's a special event after the run (like a post-run hangout, breakfast, or club experience), that part is usually ticketed. But here's the cool part: the ticket price you pay? You can redeem it at the event spot for food, drinks, and good vibes. Basically, your ticket = your breakfast tab."
        },
        {
            question: "How many kilometers is the run?",
            answer: "Most of our runs are between 5 km and 10 km. Enough to make you feel alive."
        },
        {
            question: "When do Cloka events happen?",
            answer: "Cloka club events happen on weekends (Saturday and Sunday), because who doesn't love an early morning vibe with cool people, good energy, and a little sweat? Keep an eye on our socials or cloka.in for upcoming dates. Saturday - Run club events, Sunday - Lifting club"
        },
        {
            question: "I'm not a professional runner... Can I still join?",
            answer: "YES. Whether you jog, walk, sprint, or vibe at your own pace, Cloka is for everyone. No pressure. Just show up and move however you like."
        },
        {
            question: "What do I get when I come to a Cloka event?",
            answer: "Besides endorphins and a good workout session? Think refreshments, cool people, and always a damn good experience. We host one-of-a-kind experiences you won't find anywhere else in Chennai. Be among the first to live it, not just hear about it."
        },
        {
            question: "Can I bring a friend?",
            answer: "100%. Just make sure they register too. No sneaky +1s unless they've signed up! Send them the registration link. Make sure you and your friends register ASAP!"
        },
        {
            question: "How do registrations work?",
            answer: "We usually get 400–500 sign-ups per event, but due to space and experience limits, we can only accommodate 100–130 people at a time. So here's the deal. It's first come, first served. We try our best to make sure everyone gets to experience Cloka eventually, but to lock in your spot, register as soon as the event drops. Don't wait. They fill up fast."
        }
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="bg-black text-white py-20 mx-4">
            <div className="">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-wider">
                        FAQs
                    </h2>
                    <p className="luxury-text text-lg text-zinc-300 max-w-2xl mx-auto">
                        (aka everything you wanted to know but didn&apos;t know who to ask)
                    </p>
                </motion.div>

                <div className="max-w-7xl mx-auto">
                    {faqData.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="mb-6"
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="cursor-pointer w-full text-left p-3 backdrop-blur-2xl transition-all duration-300 border-t border-zinc-800 hover:border-zinc-700"
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className="luxury-text text-2xl pr-8">
                                        {index + 1}. {item.question}
                                    </h3>
                                    <div className="flex-shrink-0">
                                        <svg
                                            className={`w-6 h-6 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </button>

                            <motion.div
                                initial={false}
                                animate={{
                                    height: openIndex === index ? 'auto' : 0,
                                    opacity: openIndex === index ? 1 : 0,
                                }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="p-6 bg-zinc-950 border-t border-zinc-800">
                                    <p className="text-xl text-zinc-300 leading-relaxed">
                                        {item.answer}
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="text-center mt-16"
                >
                    <p className="luxury-text text-lg text-zinc-400 mb-8">
                        Still have questions? We&apos;re here to help!
                    </p>
                    <a
                        href="/contact"
                        className="luxury-button inline-block"
                    >
                        Get in Touch
                    </a>
                </motion.div>
            </div>
        </section>
    );
};

export default FAQ; 