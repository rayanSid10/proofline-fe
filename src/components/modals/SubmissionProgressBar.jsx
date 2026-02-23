import { cn } from '@/lib/utils';

export function SubmissionProgressBar({ currentStep, totalSteps = 6 }) {
  return (
    <div className="bg-[#2A2A2A] rounded-[16px] p-10 w-[354px] h-[172px] flex items-center justify-center">
      <div className="flex items-center justify-center gap-3">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div
              key={index}
              className={cn(
                "rounded-full transition-all duration-500 ease-in-out",
                isActive
                  ? "w-[45px] h-[45px] bg-white shadow-lg"
                  : isCompleted
                  ? "w-[25px] h-[25px] bg-white"
                  : "w-[25px] h-[25px] bg-[#6B6B6B]"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

export default SubmissionProgressBar;
