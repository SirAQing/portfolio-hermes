import { useEffect, useState } from 'react';

export const ProgressRing = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setProgress(Math.min(Math.round((scrollTop / docHeight) * 100), 100));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-bg-base/80 backdrop-blur-sm shadow-sm border border-border-subtle flex items-center justify-center transition-all hover:scale-110">
      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 48 48">
        {/* Track */}
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="3"
        />
        {/* Progress arc */}
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
        />
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-500">
        {progress}%
      </span>
    </div>
  );
};
