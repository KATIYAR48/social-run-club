"use client";
import { useState, useEffect } from "react";
import Button from "@/components/Button";
import Image from "next/image";
import { motion } from "framer-motion";

export default function MerchPageClient() {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);
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
            <main className="container max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl text-center pb-12 font-bold">Join the waitlist for merch drops</h1>
                <div className="text-center">
                    <p className="mb-4">Please log in to join the merch waitlist.</p>
                    <a href="/auth?redirect=/merch" className="text-white hover:underline">Log in</a>
                </div>
            </main>
        );
    }

    return (
        <main className="relative flex justify-center items-center min-h-[400px] md:min-h-[500px] max-w-7xl mx-auto px-2 md:px-4 py-6 md:py-8">
            {/* Banner background */}
            <div className="absolute inset-0 w-full h-full z-0 rounded-xl overflow-hidden">
                <Image src="/images/merch-banner-landscape.png" alt="Merch Banner" fill className="object-cover w-full h-full" priority />
                <div className="absolute inset-0 bg-black/20 filter contrast-125" />
            </div>
            {/* Content */}
            <div className="relative z-10 flex flex-col md:flex-row w-full h-full items-center justify-between gap-0 md:gap-8">
                {/* Left: Animated Join Waitlist Text */}
                <div className="flex-1 mb-24 md:mb-0 flex items-center justify-center md:justify-start w-full md:w-1/2 h-full min-h-[300px]">
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        whileHover={{ scale: 1.04, rotate: -2 }}
                        className="drop-shadow-xl"
                    >
                        <motion.img
                            src="/images/join-waitlist-text.png"
                            alt="Join Waitlist Text"
                            width={400}
                            height={100}
                            className="w-full max-w-xs md:max-w-md select-none pointer-events-none"
                            style={{ filter: "brightness(1.2)" }}
                            animate={{
                                y: [0, -4, 0, 4, 0],
                                opacity: [1, 0.96, 1, 0.98, 1],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "mirror",
                            }}
                        />
                    </motion.div>
                </div>
                {/* Right: Form */}
                <form onSubmit={handleSubmit} className="flex-1 w-[90%] md:w-1/2 border border-zinc-800 rounded-2xl shadow p-4 md:p-6 space-y-4 bg-black/30 backdrop-blur-xs relative z-10 max-w-md mx-auto">
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
                        <label className="block font-medium mb-1">Size (optional)</label>
                        <select name="size" value={form.size} onChange={handleChange} className="w-full border border-zinc-800 bg-black/90 rounded px-3 py-2">
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
                    <Button variant="secondary" type="submit" className="w-full font-bold py-2 rounded disabled:opacity-60" disabled={loading}>
                        <strong> {loading ? "Joining..." : "Join Waitlist"}</strong>
                    </Button>
                </form>
            </div>
        </main>
    );
} 