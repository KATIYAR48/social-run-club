import Header from '@/components/Header';
import Shop from '@/components/Shop';
import Footer from '@/components/Footer';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

// Define the product type for the API response
interface ApiProduct {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    inStock: boolean;
    createdAt: Date;
}

export const metadata = {
    title: 'Official Merch Store - CLOKA',
    description: 'Shop exclusive, limited-edition CLOKA merchandise. Each piece is a numbered, limited-edition creation.',
};

// Fetch products from the API
async function getProducts(): Promise<ApiProduct[]> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        // Construct the API URL - if baseUrl exists, join it with the path, otherwise use relative path
        const apiUrl = baseUrl ? `${baseUrl}/api/products` : '/api/products';

        const res = await fetch(apiUrl, {
            cache: 'no-store',
            next: { revalidate: 60 }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch products');
        }

        const data = await res.json();
        return data.products || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

export default async function ShopPage() {
    // Fetch products from the API
    const products = await getProducts();

    // Map API products to match ProductProps type
    const mappedProducts = products.map(product => ({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        description: product.description
    }));

    return (
        <main>
            <Header />
            <div className="pt-20 pb-10 bg-black">
                <div className="luxury-container">
                    <h1 className="text-4xl md:text-6xl font-bold text-white text-center">Official Merch Store</h1>
                    <p className="text-white text-center mt-4 max-w-2xl mx-auto luxury-text">
                        Exclusive, limited-edition merchandise that embodies the CLOKA spirit.
                    </p>
                </div>
            </div>

            <Shop products={mappedProducts} />

            <Footer />
        </main>
    );
} 