'use client'

interface PixelLoaderProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    text?: string;
    className?: string;
}

const sizeConfig = {
    sm: { width: '30px', textSize: 'text-xl' },
    md: { width: '60px', textSize: 'text-3xl' },
    lg: { width: '90px', textSize: 'text-4xl' },
    xl: { width: '120px', textSize: 'text-5xl' }
};

export default function PixelLoader({
    size = 'md',
    showText = true,
    text = 'Loading...',
    className = ''
}: PixelLoaderProps) {
    const config = sizeConfig[size];
    const loaderWidth = config.width;

    return (
        <div className={`flex gap-5 items-center justify-center ${className}`}>
            <div
                className="loader"
                style={{ width: loaderWidth }}
            ></div>
            <style jsx>{`
                .loader {
                    display: flex;
                    align-items: flex-start;
                    aspect-ratio: 1;
                }
                .loader:before,
                .loader:after {
                    content: "";
                    flex: 1;
                    aspect-ratio: 1;
                    --g: conic-gradient(from -90deg at 10px 10px,#fff 90deg,#0000 0);
                    background: var(--g), var(--g), var(--g);
                    filter: drop-shadow(30px 30px 0 #fff);
                    animation: l20 1s infinite;
                }
                .loader:after {
                    transform: scaleX(-1);
                }
                @keyframes l20 {
                    0%   {background-position:0     0, 10px 10px, 20px 20px}
                    33%  {background-position:10px  10px}
                    66%  {background-position:0    20px,10px 10px,20px 0   }
                    100% {background-position:0     0, 10px 10px, 20px 20px}
                }
            `}</style>

            {showText && (
                <div className="text-md">{text}</div>
            )}
        </div>
    );
}