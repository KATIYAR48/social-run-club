import Image from "next/image";
import { motion } from "framer-motion";

export default function AnimatedImages() {
    return (
        <div className="flex flex-row md:flex-col justify-center items-center md:mr-10 w-full md:w-auto mb-6 md:mb-0">

            <div className="flex flex-row md:flex-col gap-4 md:gap-6 px-3 justify-center items-end w-full md:max-w-xs">
                {["1.png", "2.png", "3.png"].map((img, i) => (
                    <motion.div
                        key={img}
                        initial={{ y: 40, opacity: 0, scale: 0.95, rotateX: 0, rotateY: 0 }}
                        animate={{
                            y: [40, -10, 0, 10, 0, 40],
                            opacity: [0, 1, 1, 1, 1, 0.8],
                            scale: [0.95, 1.05, 1, 1.03, 1, 0.97],
                            rotateX: [0, 8, -8, 6, 0, -6, 0],
                            rotateY: [0, -10, 10, -8, 0, 8, 0],
                            filter: [
                                "contrast(1) brightness(1)",
                                "contrast(1.2) brightness(1.1)",
                                "contrast(1.1) brightness(1.2)",
                                "contrast(1.3) brightness(0.9)",
                                "contrast(1) brightness(1)",
                                "contrast(1.1) brightness(1.1)"
                            ],
                        }}
                        whileHover={{
                            scale: 1.08,
                            rotateX: 12,
                            rotateY: -12,
                            boxShadow: "0 8px 32px 0 rgba(255,0,255,0.25)",
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            repeatType: "mirror",
                            delay: i * 0.3,
                        }}
                        className="relative rounded-xl overflow-hidden shadow-lg border border-zinc-800 bg-black/80"
                        style={{ width: 180, height: 180, zIndex: 2 - i }}
                    >
                        <Image
                            height={200}
                            width={200}
                            src={`/images/merch/${img}`}
                            alt={`Merch ${i + 1}`}
                            className="object-cover w-full h-full select-none pointer-events-none"
                            draggable={false}
                        />
                        {/* Glitch overlay */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            style={{ mixBlendMode: "screen" }}
                            animate={{
                                opacity: [0.1, 0.3, 0.15, 0.25, 0.1],
                                x: [0, 2, -2, 1, 0],
                                y: [0, -2, 2, -1, 0],
                            }}
                            transition={{
                                duration: 0.7,
                                repeat: Infinity,
                                repeatType: "mirror",
                                delay: i * 0.2,
                            }}
                        >
                            <div className="w-full h-full bg-gradient-to-tr from-pink-500/30 via-blue-400/20 to-purple-500/20" />
                        </motion.div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}