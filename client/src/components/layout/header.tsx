import { useEffect, useState } from "react";

interface HeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 0;
      setIsScrolled(scrolled);
    };

    // Set initial state based on current scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Also check scroll position when component updates (e.g., language change)
  useEffect(() => {
    const scrolled = window.scrollY > 0;
    setIsScrolled(scrolled);
  }, [title, subtitle]);

  return (
    <header className={`sticky z-50 border-b border-gray-200 px-4 lg:px-8 py-3 lg:py-4 transition-all duration-200 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-sm shadow-sm' 
        : 'bg-surface'
    }`} style={{ top: 'var(--alert-height, 0px)' }}>
      <div className="flex items-center justify-between min-h-[56px] lg:min-h-[64px]">
        <div className="ml-12 lg:ml-0">
          <h1 className="text-lg lg:text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
          <p className="text-secondary text-xs lg:text-base leading-tight">{subtitle}</p>
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
