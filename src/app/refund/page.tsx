import React from 'react';
import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
    title: 'Cancellation & Refund Policy | Cloka',
    description: 'Cancellation and refund policy information for Cloka customers',
};

export default function RefundPolicy() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Header />
            <h1 className="text-3xl font-bold mb-6">Cancellation & Refund Policy</h1>

            <div className="prose max-w-none space-y-8">
                <section>
                    <p className="mb-6">
                        At Cloka.in, we strive to ensure you&apos;re delighted with every purchase. Below are the terms and conditions for cancelling an order or requesting a refund. Please read this policy carefully before placing your order.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">Order Cancellation</h2>
                    <div className="space-y-4">
                        <h3 className="text-xl font-medium">Before Shipment</h3>
                        <p>
                            You may cancel your order at no cost if it has not yet been processed or shipped. To cancel, contact us within 24 hours of placing your order at support@cloka.in with your order number. Once processed (within 2-3 business days), cancellation may not be possible.
                        </p>

                        <h3 className="text-xl font-medium">After Shipment</h3>
                        <p>
                            Once your order has been shipped, cancellation is no longer an option. However, you may return the order after delivery as per our Return Policy (see below).
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">Returns Eligibility</h2>
                    <p className="mb-4">We accept returns for items that meet the following conditions:</p>
                    <ul className="list-disc pl-6 mb-4">
                        <li>The product is unused, unworn, unwashed, and in its original condition with all tags and packaging intact.</li>
                        <li>The return request is raised within 7 days of delivery.</li>
                        <li>The item is defective, damaged, or not as described (e.g., wrong size, color, or product delivered).</li>
                    </ul>

                    <p className="font-medium mb-2">Non-returnable items include:</p>
                    <ul className="list-disc pl-6">
                        <li>Products marked as &quot;Final Sale&quot; or purchased during special promotions (unless defective).</li>
                        <li>Undergarments, socks, or other items deemed non-returnable for hygiene reasons.</li>
                        <li>Event tickets and registrations are non-refundable and non-transferable.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">How to Request a Return</h2>
                    <ul className="list-disc pl-6">
                        <li>Contact us at support@cloka.in within 7 days of delivery with your order number and reason for return.</li>
                        <li>For defective or incorrect items, please include photos of the product and packaging.</li>
                        <li>Once approved, we&apos;ll provide instructions for returning the item via our designated courier partner. Please ship the item back within 5 days of approval.</li>
                        <li>Return shipping costs will be borne by Cloka.in for defective or incorrect items. For other reasons (e.g., change of mind), the customer is responsible for return shipping charges.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">Refund Process</h2>
                    <ul className="list-disc pl-6">
                        <li>Once we receive and inspect the returned item (typically within 3-5 business days), we&apos;ll notify you via email about the approval or rejection of your refund.</li>
                        <li>If approved, your refund will be processed to the original payment method within 7-10 business days. The exact time for the amount to reflect in your account may depend on your bank or payment provider.</li>
                        <li>Shipping charges (if paid at checkout) and return shipping costs (if applicable) are non-refundable unless the return is due to our error or a defective product.</li>
                        <li>For Cash on Delivery (COD) orders, refunds will be issued via bank transfer or UPI, and you&apos;ll need to provide your payment details.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">Exchanges</h2>
                    <p>
                        We currently do not offer direct exchanges. If you&apos;d like a different size or color, please return the original item and place a new order.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">Cancellations or Refunds Due to Non-Delivery</h2>
                    <p>
                        If your order is not delivered within 15 business days from the shipment date (or as per tracking updates), please contact us. We&apos;ll investigate with the courier and, if deemed lost, offer a full refund or reshipment at no additional cost.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                    <p>
                        For assistance with cancellations, returns, or refunds, reach out to us at support@cloka.in. We&apos;re happy to assist you!
                    </p>
                </section>
            </div>
            <Footer />
        </div>
    );
} 