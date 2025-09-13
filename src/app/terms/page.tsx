import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "Terms of Service - Cloka",
    description: "Terms and conditions for using Cloka services",
};

export default function TermsPage() {
    return (
        <>
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

                <div className="prose prose-lg max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using Cloka&apos;s services, you agree to be bound by these Terms of Service
                            and all applicable laws and regulations. If you do not agree with any of these terms, you
                            are prohibited from using or accessing this site.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
                        <p>
                            Permission is granted to temporarily access the materials (information or software) on
                            Cloka&apos;s website for personal, non-commercial transitory viewing only.
                        </p>
                        <p className="mt-4">This license shall automatically terminate if you violate any of these restrictions and may be terminated by Cloka at any time.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                        <p>
                            When you create an account with us, you must provide accurate, complete, and current
                            information. You are responsible for safeguarding the password and for all activities that
                            occur under your account.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">4. Service Modifications</h2>
                        <p>
                            Cloka reserves the right to modify or discontinue, temporarily or permanently, the service
                            with or without notice. We shall not be liable to you or any third party for any
                            modification, suspension, or discontinuance of the service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">5. Event Participation and Liability</h2>
                        <p className="mb-4">
                            By participating in any Cloka events, including but not limited to running events, trekking,
                            trail runs, fitness activities, and any outdoor adventures, you acknowledge and agree to the following:
                        </p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>
                                <strong>Personal Injury:</strong> You participate at your own risk. Cloka shall not be liable for any
                                injuries, accidents, or health issues that may occur during the course of any event, including
                                but not limited to falls, collisions, overexertion, or any other physical harm.
                            </li>
                            <li>
                                <strong>Travel and Transportation:</strong> Cloka is not responsible for any accidents, damages,
                                or incidents that occur during travel to and from event locations, including car crashes,
                                vehicle damage, or transportation-related injuries, regardless of the route taken.
                            </li>
                            <li>
                                <strong>Property Loss or Theft:</strong> Participants are solely responsible for their personal
                                belongings, including but not limited to clothing, equipment, valuables, and electronic devices.
                                Cloka shall not be liable for any loss, theft, or damage to personal property during events.
                            </li>
                            <li>
                                <strong>Environmental Risks:</strong> Outdoor activities carry inherent risks including but not
                                limited to weather conditions, terrain hazards, wildlife encounters, and natural disasters.
                                Participants assume all such risks.
                            </li>
                            <li>
                                <strong>Medical Fitness:</strong> It is your responsibility to ensure you are medically fit
                                to participate in the event. Cloka recommends consulting with a healthcare provider before
                                participating in any physically demanding activities.
                            </li>
                        </ul>
                        <p className="font-semibold">
                            By registering for any Cloka event, you expressly waive any claims against Cloka, its organizers,
                            volunteers, and partners for any injuries, damages, or losses that may occur during the event.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
                        <p>
                            In no event shall Cloka or its suppliers be liable for any damages arising out of the use
                            or inability to use the materials on Cloka&apos;s website, even if Cloka or an authorized
                            representative has been notified orally or in writing of the possibility of such damage.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">7. Play Nice & Stay Safe</h2>
                        <p>
                            Please follow all instructions given by the experience/event team. Respect the organisers,
                            other participants, and the space. Unsafe or disruptive behaviour can lead to removal from
                            the experience/event.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">8. Photo & Media Consent</h2>
                        <p>
                            Photos and videos may be taken at the experience/event for promotional purposes. If you
                            prefer not to be photographed, please inform the organisers beforehand.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
                        <p>
                            These terms and conditions are governed by and construed in accordance with the laws and
                            you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
                        <p>
                            Cloka reserves the right to revise these terms of service at any time without notice. By
                            using this website, you are agreeing to be bound by the current version of these terms
                            of service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
                        <p>
                            If you have any questions about these Terms of Service, please contact us through our
                            <a href="https://forms.gle/2enLCA1zNw3QSJYs9" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline"> support form</a> or other support channels.
                        </p>
                        <div className="mt-4">
                            <p className="font-semibold mb-1">Cloka India</p>
                            <address className="not-italic">
                                17/1, White gate house,<br />
                                (Opposite to Rose of Sharon AG Church)<br />
                                Zachariah Colony 2nd St,<br />
                                Minor Trustpuram, Choolaimedu,<br />
                                Chennai, Tamil Nadu 600094
                            </address>
                            <p className="mt-2 font-semibold">
                                info@cloka.in
                            </p>
                        </div>
                    </section>

                    <div className="mt-12 text-sm text-gray-600">
                        <p>Last updated: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
} 