import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Custom checkmark SVG matching Figma design
const SuccessCheckmark = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="37" stroke="#22C55E" strokeWidth="6"/>
    <path d="M24 40L35 51L56 30" stroke="#22C55E" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function SubmissionSuccessDialog({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/50" />
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-[380px] p-10 flex flex-col items-center animate-in fade-in zoom-in duration-300">
            {/* Success Checkmark Circle */}
            <div className="mb-8">
              <SuccessCheckmark />
            </div>

            {/* Success Message */}
            <p className="text-[18px] font-medium text-black text-center leading-relaxed mb-8">
              Your Investigation sent to<br />
              the supervisor for review
            </p>

            {/* OK Button */}
            <Button
              onClick={onClose}
              className="w-[140px] h-[44px] bg-[#22C55E] hover:bg-[#16A34A] text-white text-[16px] font-semibold rounded-lg shadow-md"
            >
              OK
            </Button>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}

export default SubmissionSuccessDialog;
