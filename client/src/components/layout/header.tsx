interface HeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-gray-200 px-4 lg:px-8 py-4">
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
