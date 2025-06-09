"use client";
import { useState, useEffect } from "react";
import Button from "@/components/Button";
import { motion } from "framer-motion";
import Image from "next/image";

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
                    <a href="/login" className="text-white hover:underline">Log in</a>
                </div>
            </main>
        );
    }

    return (
        <main className="flex flex-col md:flex-row justify-center items-start max-w-4xl mx-auto px-2 md:px-4 py-6 md:py-8 gap-6 md:gap-0">
            {/* Animated Merch Images */}
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
            <div className="w-full p-2 md:p-5">
                <div>
                    <h1 className="text-4xl md:text-5xl text-start mb-2 font-bold">Want Limited Edition Merch Drops?</h1>
                    <p className="text-start text-zinc-400 pb-5 ">Join the waitlist to be notified when new merch drops!</p>
                </div>
                <form onSubmit={handleSubmit} className="border border-zinc-800 rounded-lg shadow p-4 md:p-6 space-y-4 bg-black/80">
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