import { X, Info } from "lucide-react";
import { Button } from "./button";
import { useState } from "react";

interface AlertBannerProps {
  message: string;
  type?: 'info' | 'warning' | 'success';
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function AlertBanner({ 
  message, 
  type = 'info', 
  dismissible = true, 
  onDismiss,
  className = '' 
}: AlertBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const typeStyles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    success: 'bg-green-50 text-green-800 border-green-200'
  };

  const iconStyles = {
    info: 'text-blue-500',
    warning: 'text-amber-500',
    success: 'text-green-500'
  };

  return (
    <div className={`border-l-4 p-4 ${typeStyles[type]} ${className}`} data-testid="alert-banner">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Info className={`h-5 w-5 mr-3 ${iconStyles[type]}`} />
          <p className="text-sm font-medium">{message}</p>
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="p-1 h-auto"
            data-testid="button-dismiss-alert"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}