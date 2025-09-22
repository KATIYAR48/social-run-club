"use client";

import React from "react";
import { Carousel, Card } from "@/components/ui/photo-cards-carousel";

export function LifeAtClokaSection() {
    const cards = data.map((card, index) => (
        <Card key={card.src} card={card} index={index} />
    ));

    return (
        <div className="h-full pt-10 pb-10 mx-5 md:mx-0">
            <h2 className="container mx-auto text-lg md:text-3xl font-bold text-neutral-800 dark:text-neutral-200 font-sans">
                Life at Cloka
            </h2>
            <Carousel items={cards} />
        </div>
    );
}

const DummyContent = () => {
    return (
        <>
            {[...new Array(3).fill(1)].map((_, index) => {
                return (
                    <div
                        key={"dummy-content" + index}
                        className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4"
                    >
                        <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
                            <span className="font-bold text-neutral-700 dark:text-neutral-200">
                                The first rule of Apple club is that you boast about Apple club.
                            </span>{" "}
                            Keep a journal, quickly jot down a grocery list, and take amazing
                            class notes. Want to convert those notes to text? No problem.
                            Langotiya jeetu ka mara hua yaar is ready to capture every
                            thought.
                        </p>
                        <img
                            src="https://assets.aceternity.com/macbook.png"
                            alt="Macbook mockup from Aceternity UI"
                            height="500"
                            width="500"
                            className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain"
                        />
                    </div>
                );
            })}
        </>
    );
};

const data = [
    {
        category: "Lift together, unleash your strength—where every rep builds confidence, fosters friendships, and fuels a community that rises stronger, week after week",
        title: "Cloka Lifting Club",
        src: "/images/merch/1.png",
        content: <DummyContent />,
    },
    {
        category: "Run together, discover your rhythm—where every step ignites stories, friendships, and post-run café vibes that turn ordinary Saturdays into unforgettable journeys for every kind of runner.",
        title: "Cloka Run Club",
        src: "/images/merch/2.png",
        content: <DummyContent />,
    },
    {
        category: "Cloka Mallathon is India’s first-ever mall marathon event, launched by the Cloka Run Club, where more than 500 runners completed a unique 5km route inside Phoenix Marketcity and Palladium Chennai on August 30, 2025. ",
        title: "Mallathon",
        src: "/images/merch/3.png",
        content: <DummyContent />,
    },
    {
        category: "Serve up your best game and rally with Chennai’s finest at the Cloka Pickleball Tournament—where friendly competition meets community spirit, and every match brings new connections and unforgettable moments.",
        title: "Cloka Pickleball Tournament",
        src: "/images/merch/1.png",
        content: <DummyContent />,
    },
];
