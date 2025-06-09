import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MerchPageClient from "@/components/MerchPageClient";

export const metadata: Metadata = {
    title: "Merch - Cloka",
    description: "Merch and data handling practices for Cloka services",
};

export default function MerchPage() {
    return (
        <>
            <Header />
            <MerchPageClient />
            <Footer />
        </>
    );
} 