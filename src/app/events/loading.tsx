import Loader from '@/components/ui/PixelLoader';

export default function EventsLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader
                text="Loading events..."
            />
        </div>
    );
} 