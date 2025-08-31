import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function RoleSwitcher() {
  const [currentRole, setCurrentRole] = useState(
    new URLSearchParams(window.location.search).get('role') || 'ADMIN'
  );

  const switchRole = (newRole: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('role', newRole);
    window.location.href = url.toString();
  };

  if (import.meta.env.PROD) {
    return null; // Don't show in production
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600 dark:text-gray-300">Dev Role:</span>
        <Select value={currentRole} onValueChange={switchRole}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="OWNER">Client</SelectItem>
            <SelectItem value="WORKER">Worker</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}