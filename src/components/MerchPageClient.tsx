"use client";
import { useState, useEffect } from "react";
import Button from "@/components/Button";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function MerchPageClient() {
    const router = useRouter();
    const [form, setForm] = useState({
        preferredMerch: "T-shirt",
        size: "",
        colorPreference: "",
        additionalInfo: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const [checkedAuth, setCheckedAuth] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();
                if (data.success && data.user) {
                    setUser({ name: data.user.name, email: data.user.email });
                }
            } catch { }
            setCheckedAuth(true);
        }
        fetchUser();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        if (!form.preferredMerch) {
            return "Please select a preferred merch type.";
        }
        if (!form.size) {
            return "Please select a size.";
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setLoading(true);
        setMessage(null);
        setError(null);
        const validationError = validateForm();
        if (validationError) {
            setFormError(validationError);
            setLoading(false);
            return;
        }
        try {
            const res = await fetch("/api/merch-waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                setMessage(data.message || "You have been added to the merch waitlist!");
                setForm({
                    preferredMerch: "T-shirt",
                    size: "",
                    colorPreference: "",
                    additionalInfo: "",
                });
            } else {
                setError(data.message || "Something went wrong.");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!checkedAuth) {
        return <div className="text-center py-8">Loading...</div>;
    }

    if (!user) {
        return (
            <main className="container max-w-8xl mx-auto mt-12 relative flex justify-center items-center min-h-[400px] md:min-h-[500px] md:px-4 py-6 md:py-8">
                {/* Banner background */}
                <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                    <Image src="/images/merch-banner-landscape.png" alt="Merch Banner" fill className="object-cover w-full h-full" priority />
                    <div className="absolute inset-0 bg-black/20 filter contrast-125" />
                </div>
                {/* Content */}
                <div className="relative z-10 flex flex-col md:flex-row w-full h-full items-center justify-between gap-0 md:gap-8">
                    {/* Left: Animated Join Waitlist Text */}
                    <div className="flex-1 mb-24 md:mb-0 flex items-center justify-center md:justify-start w-full md:w-1/2 h-full min-h-[300px]">
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 1 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            whileHover={{ scale: 1.04, }}
                            className="drop-shadow-xl hover:cursor-pointer"
                        >
                            <motion.img
                                src="/images/join-waitlist-text.png"
                                alt="Join Waitlist Image"
                                width={400}
                                height={100}
                                className="w-full max-w-xs md:max-w-md select-none pointer-events-none"
                                style={{ filter: "brightness(1.1)" }}
                                animate={{
                                    filter: [
                                        "brightness(1.2) drop-shadow(0 0 2px #fff) drop-shadow(0 0 4px #fff)",
                                        "brightness(1.1) drop-shadow(0 0 1px #fff) drop-shadow(0 0 2px #fff)",
                                        "brightness(1.3) drop-shadow(0 0 3px #fff) drop-shadow(0 0 6px #fff)",
                                        "brightness(1.1) drop-shadow(0 0 1px #fff) drop-shadow(0 0 2px #fff)",
                                        "brightness(1.2) drop-shadow(0 0 2px #fff) drop-shadow(0 0 4px #fff)"
                                    ],
                                    opacity: [1, 0.95, 1, 0.97, 1],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    repeatType: "mirror",
                                }}
                            />

                        </motion.div>
                    </div>
                    {/* Right: Button or Form */}
                    <div className="flex-1 w-[90%] md:w-1/2 flex md:mr-10 justify-end items-center max-w-md mx-auto">
                        {user ?
                            <motion.button
                                className="relative px-12 cursor-pointer bg-white/80 text-black shadow-inner backdrop-blur-xs font-bold py-4 text-lg overflow-hidden"
                                onClick={() => setShowForm(true)}

                            >

                                <span className="relative z-10">Join Waitlist</span>
                            </motion.button> : <motion.button
                                className="relative px-12 cursor-pointer bg-white/80 text-black shadow-inner backdrop-blur-xs font-bold py-4 text-lg overflow-hidden"
                                onClick={() => router.push("/auth?redirect=/")}
                                initial={{ boxShadow: '0 0 0 0 #fff' }}
                                animate={{
                                    boxShadow: [
                                        '0 0 5px 2px rgba(255, 255, 255, 0.8)',
                                        '0 0 15px 4px rgba(255, 255, 255, 0.9)',
                                        '0 0 5px 2px rgba(255, 255, 255, 0.8)',
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity, repeatType: 'loop' }}
                            >
                                <span className="absolute inset-0 z-0 rounded-2xl pointer-events-none">
                                    <motion.span
                                        className="absolute inset-0 rounded-2xl border-2 border-zinc-400"
                                        style={{ borderImage: 'linear-gradient(90deg, #ffffff, #ffffff, #ffffff) 1' }}
                                        initial={{ opacity: 0.7 }}
                                        animate={{
                                            opacity: [0.7, 1, 0.7],
                                            filter: [
                                                'blur(2px) brightness(1)',
                                                'blur(5px) brightness(1.2)',
                                                'blur(3px) brightness(1)'
                                            ]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity, repeatType: 'loop' }}
                                    />
                                </span>
                                <span className="uppercase font-normal relative z-10">Login to Join <strong className="font-bold">Waitlist</strong></span>
                            </motion.button>}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="mt-12 relative flex justify-center items-center min-h-[400px] md:min-h-[500px] container mx-auto px-2 md:px-4 py-6 md:py-8">
            {/* Banner background */}
            <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                <Image src="/images/merch-banner-landscape.png" alt="Merch Banner" fill className="object-cover w-full h-full" priority />
                <div className="absolute inset-0 bg-black/20 filter contrast-125" />
            </div>
            {/* Content */}
            <div className="relative z-10 flex flex-col md:flex-row w-full h-full items-center justify-between gap-0 md:gap-8">
                {/* Left: Animated Join Waitlist Text */}
                <div className="flex-1 mb-24 md:mb-0 flex items-center justify-center md:justify-start w-full md:w-1/2 h-full min-h-[300px]">
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 1 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        whileHover={{ scale: 1.04, }}
                        className="drop-shadow-xl"
                    >
                        <motion.img
                            src="/images/join-waitlist-text.png"
                            alt="Join Waitlist Text"
                            width={400}
                            height={100}
                            className="w-full max-w-xs md:max-w-md select-none  hover:cursor-pointer"
                            style={{ filter: "brightness(1.1)" }}
                            whileTap={{ scale: 1.2 }}
                            animate={{
                                filter: [
                                    "brightness(1.2) drop-shadow(0 0 2px #fff) drop-shadow(0 0 4px #fff)",
                                    "brightness(1.1) drop-shadow(0 0 1px #fff) drop-shadow(0 0 2px #fff)",
                                    "brightness(1.3) drop-shadow(0 0 3px #fff) drop-shadow(0 0 6px #fff)",
                                    "brightness(1.1) drop-shadow(0 0 1px #fff) drop-shadow(0 0 2px #fff)",
                                    "brightness(1.2) drop-shadow(0 0 2px #fff) drop-shadow(0 0 4px #fff)"
                                ],
                                opacity: [1, 0.95, 1, 0.97, 1],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "mirror",
                            }}
                        />

                    </motion.div>
                </div>
                {/* Right: Button or Form */}
                <div className="flex-1 w-[90%] md:w-1/2 flex md:mr-10 justify-end items-center max-w-md mx-auto">
                    {!showForm ? (
                        <motion.button
                            className="relative px-12 cursor-pointer bg-white shadow-lg text-black backdrop-blur-xs font-bold py-4 text-lg overflow-hidden"
                            onClick={() => setShowForm(true)}
                        >
                            <span className="relative z-10 uppercase font-bold">Join Waitlist</span>
                        </motion.button>
                    ) : (
                        <motion.form
                            onSubmit={handleSubmit}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="flex-1 w-full border border-zinc-800 shadow p-4 md:p-6 space-y-4 bg-black/30 backdrop-blur-xs relative z-10 max-w-md mx-auto"
                        >
                            {formError && <div className="text-red-600 font-medium">{formError}</div>}
                            <div>
                                <label className="block font-medium mb-1">Preferred Merch<span className="text-red-500">*</span></label>
                                <select name="preferredMerch" value={form.preferredMerch} onChange={handleChange} required className="w-full border border-zinc-800 bg-black/90 rounded px-3 py-2">
                                    <option value="T-shirt">T-shirt</option>
                                    <option value="Hoodie">Hoodie</option>
                                    <option value="Cap">Cap</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Size <span className="text-red-500">*</span></label>
                                <select name="size" value={form.size} onChange={handleChange} className="w-full border border-zinc-800 bg-black/90 rounded px-3 py-2" required>
                                    <option value="">Select size</option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                    <option value="XL">XL</option>
                                    <option value="XXL">XXL</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Color Preference (optional)</label>
                                <input name="colorPreference" value={form.colorPreference} onChange={handleChange} className="w-full border border-zinc-800 bg-black/90 rounded px-3 py-2" />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Additional Info (optional)</label>
                                <textarea name="additionalInfo" value={form.additionalInfo} onChange={handleChange} className="w-full border border-zinc-800 bg-black/90 rounded px-3 py-2" rows={2} />
                            </div>
                            {message && <div className="text-green-600 font-medium">{message}</div>}
                            {error && <div className="text-red-600 font-medium">{error}</div>}
                            <Button variant="secondary" type="submit" className="w-full font-bold bg-white/60 text-black py-2 disabled:opacity-60" disabled={loading || !!formError}>
                                <strong> {loading ? "Joining..." : "Join Waitlist"}</strong>
                            </Button>
                        </motion.form>
                    )}
                </div>
            </div>
        </main>
    );
} 