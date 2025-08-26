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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 border-b border-gray-200 px-4 lg:px-8 py-4 transition-all duration-200 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-sm shadow-sm' 
        : 'bg-surface'
    }`}>
      <div className="flex items-center justify-between">
        <div className="ml-12 lg:ml-0">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-secondary text-sm lg:text-base">{subtitle}</p>
        </div>
        {actions && <div>{actions}</div>}
      </div>
    </header>
  );
}
