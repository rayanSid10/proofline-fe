import { Rocket } from 'lucide-react';

export function ComingSoon({ feature = 'This Feature' }) {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Rocket className="h-16 w-16 text-gray-400 animate-rocket-launch" />
        </div>
        <p className="text-gray-500 text-lg">
          {feature} - Coming Soon
        </p>
      </div>
    </div>
  );
}

export default ComingSoon;
