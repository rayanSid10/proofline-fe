import { Lock } from 'lucide-react';

export function AccessDenied() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Lock className="h-16 w-16 text-gray-400 animate-lock-shake" />
        </div>
        <p className="text-gray-500 text-lg">
          Access Restricted - Supervisor Only
        </p>
      </div>
    </div>
  );
}

export default AccessDenied;
