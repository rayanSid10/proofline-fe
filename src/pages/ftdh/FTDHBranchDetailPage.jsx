import { useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  MOCK_FTDH_CASES,
  formatDateTime,
  formatAmount,
} from '@/data/mockFTDH';

// Submit Response Icon (chat bubble)
const SubmitResponseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M7.50977 19.8018C8.83126 20.5639 10.3645 21 11.9996 21C16.9702 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.6351 3.43604 15.1684 4.19819 16.4899L4.20114 16.495C4.27448 16.6221 4.31146 16.6863 4.32821 16.7469C4.34401 16.804 4.34842 16.8554 4.34437 16.9146C4.34003 16.9781 4.3186 17.044 4.27468 17.1758L3.50586 19.4823L3.50489 19.4853C3.34268 19.9719 3.26157 20.2152 3.31938 20.3774C3.36979 20.5187 3.48169 20.6303 3.62305 20.6807C3.78482 20.7384 4.02705 20.6577 4.51155 20.4962L4.51758 20.4939L6.82405 19.7251C6.95537 19.6813 7.02214 19.6591 7.08559 19.6548C7.14475 19.6507 7.19578 19.6561 7.25293 19.6719C7.31368 19.6887 7.37783 19.7257 7.50563 19.7994L7.50977 19.8018Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================================================
// ORIGINAL SIMPLE VIEW COMPONENTS (for cases 1, 2, 6, 7, 8)
// ============================================================================

// Simple Timeline Step Component (Original Design)
function SimpleTimelineStep({
  title,
  datetime,
  isActive = true,
  isLast = false,
  showLine = true,
  showSubmitButton = false,
  onSubmitClick,
  canSubmit = false,
}) {
  return (
    <div className="relative">
      <div className="flex items-start gap-4">
        {/* Circle indicator */}
        <div className="relative flex-shrink-0">
          <div className={`w-[38px] h-[38px] rounded-full border-[3px] flex items-center justify-center ${
            isActive ? 'border-[#2064B7] bg-white' : 'border-[#FFE0DE] bg-white'
          }`}>
            <div className={`w-[20px] h-[20px] rounded-full ${
              isActive ? 'bg-[#2064B7]' : 'bg-[#FFE0DE]'
            }`} />
          </div>
          {/* Vertical line */}
          {showLine && !isLast && (
            <div className="absolute left-1/2 top-[38px] w-[2px] h-[82px] bg-[#DAE1E7] -translate-x-1/2" />
          )}
        </div>
        {/* Content + Button in same row */}
        <div className="flex-1 flex items-center justify-between pt-1">
          <div>
            <p className="text-[16px] font-medium text-[#4C4C4C] font-['Jost',sans-serif]">{title}</p>
            <p className="text-[10px] text-[#AFAFAF] font-medium mt-0.5">{datetime}</p>
          </div>
          {/* Submit Response Button - aligned to right */}
          {showSubmitButton && (
            <Button
              onClick={onSubmitClick}
              disabled={!canSubmit}
              className={`h-[32px] px-4 text-[14px] font-medium rounded-[20px] flex items-center gap-2 ${
                canSubmit
                  ? 'bg-[#2064B7] hover:bg-[#2064B7]/90 text-white'
                  : 'bg-[#AFAFAF] text-white cursor-not-allowed'
              }`}
            >
              <SubmitResponseIcon />
              Submit Response
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Radio Button Component
function RadioButton({ checked, onChange, label, name }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
        checked ? 'border-[#2064B7]' : 'border-[#DAE1E7]'
      }`}>
        {checked && <div className="w-2.5 h-2.5 rounded-full bg-[#2064B7]" />}
      </div>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="text-[14px] text-[#4C4C4C]">{label}</span>
    </label>
  );
}

// Loading Dots Animation
function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-4 h-4 rounded-full bg-white animate-pulse"
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
}

// Success Dialog Component
function SuccessDialog({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="bg-white rounded-[20px] shadow-xl p-8 w-[320px] text-center">
        {/* Green checkmark circle */}
        <div className="w-[80px] h-[80px] mx-auto mb-4 rounded-full bg-[#E8F8EF] flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M33.3333 10L15 28.3333L6.66667 20" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h3 className="text-[20px] font-semibold text-[#4C4C4C] mb-6">
          Response Successfully<br/>sent to the IO
        </h3>

        <Button
          onClick={onClose}
          className="w-full h-[44px] bg-[#2064B7] hover:bg-[#2064B7]/90 text-white rounded-[10px] text-[16px] font-medium"
        >
          OK
        </Button>
      </div>
    </div>
  );
}

// Response Card Component - Shows response history (Original Design)
function ResponseCard({ status, datetime, responseData, isExpanded, onToggle }) {
  // status: 'sent' | 'rejected' | 'accepted'
  const statusConfig = {
    sent: {
      label: 'Response Sent',
      bgColor: 'bg-[#FBFDFF]',
      textColor: 'text-[#4C4C4C]',
      borderColor: 'border-[#EDF1F4]',
      borderStyle: 'border-2',
      borderRadius: '14px 0 14px 14px', // pointy top-right
    },
    rejected: {
      label: 'Response Rejected',
      bgColor: 'bg-[#FDE5DC]',
      textColor: 'text-[#4C4C4C]',
      borderColor: 'border-[#FFCEC9]',
      borderStyle: 'border-2',
      borderRadius: '0 14px 14px 14px', // pointy top-left
    },
    accepted: {
      label: 'Response Accepted',
      bgColor: 'bg-[#E2FFED]',
      textColor: 'text-[#4C4C4C]',
      borderColor: 'border-[#9AFABE]',
      borderStyle: 'border-2',
      borderRadius: '0 14px 14px 14px', // pointy top-left
    },
  };

  const config = statusConfig[status] || statusConfig.sent;

  return (
    <div
      className={`${config.bgColor} ${config.borderStyle} ${config.borderColor} overflow-hidden`}
      style={{ borderRadius: config.borderRadius }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className={`text-[14px] font-medium ${config.textColor}`}>{config.label}</p>
          <p className="text-[10px] text-[#AFAFAF]">{datetime}</p>
        </div>
        <button
          onClick={onToggle}
          className="text-[#2064B7] text-[12px] font-medium hover:underline"
        >
          View Details
        </button>
      </div>

      {/* Expandable Details */}
      {isExpanded && responseData && (
        <div className="border-t border-[#EDF1F4] px-4 py-4 space-y-4 bg-white">
          {/* Question 1 */}
          <div>
            <p className="text-[14px] font-medium text-[#4C4C4C] mb-1">1. Branch contacted the customer?</p>
            <div className="bg-[#F9FAFB] border border-[#EDF1F4] rounded-[4px] p-3">
              <p className="text-[14px] text-[#4C4C4C]">{responseData.contactedCustomer}</p>
              {responseData.contactedCustomer === 'No' && responseData.reasonNotContacting && (
                <div className="mt-2">
                  <p className="text-[10px] text-[#AFAFAF]">Reason for Not Contacting</p>
                  <p className="text-[12px] text-[#4C4C4C]">{responseData.reasonNotContacting}</p>
                </div>
              )}
            </div>
          </div>

          {/* Question 2 */}
          <div>
            <p className="text-[14px] font-medium text-[#4C4C4C] mb-1">2. The customer owned the transaction</p>
            <div className="bg-[#F9FAFB] border border-[#EDF1F4] rounded-[4px] p-3">
              <p className="text-[14px] text-[#4C4C4C]">{responseData.customerOwnedTransaction}</p>
              {responseData.customerOwnedTransaction === 'Yes' && responseData.customerStanceFileName && (
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-[10px] text-[#AFAFAF]">Customer Stance:</p>
                  <p className="text-[12px] text-[#2064B7]">{responseData.customerStanceFileName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Question 3 */}
          <div>
            <p className="text-[14px] font-medium text-[#4C4C4C] mb-1">3. Customer Provided the Evidence?</p>
            <div className="bg-[#F9FAFB] border border-[#EDF1F4] rounded-[4px] p-3">
              <p className="text-[14px] text-[#4C4C4C]">{responseData.providedEvidence}</p>
              {responseData.providedEvidence === 'Yes' && responseData.evidenceFileName && (
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-[10px] text-[#AFAFAF]">Evidence File:</p>
                  <p className="text-[12px] text-[#2064B7]">{responseData.evidenceFileName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Question 4 */}
          <div>
            <p className="text-[14px] font-medium text-[#4C4C4C] mb-1">4. Did the Branch perform KYC / CDD?</p>
            <div className="bg-[#F9FAFB] border border-[#EDF1F4] rounded-[4px] p-3">
              <p className="text-[14px] text-[#4C4C4C]">{responseData.performedKYC}</p>
              {responseData.performedKYC === 'No' && responseData.kycReason && (
                <div className="mt-2">
                  <p className="text-[10px] text-[#AFAFAF]">Reason for not performing KYC / CDD</p>
                  <p className="text-[12px] text-[#4C4C4C]">{responseData.kycReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Question 5 */}
          <div>
            <p className="text-[14px] font-medium text-[#4C4C4C] mb-1">5. Branch feedback on the customer profile</p>
            <div className="bg-[#F9FAFB] border border-[#EDF1F4] rounded-[4px] p-3">
              <p className="text-[14px] text-[#4C4C4C]">{responseData.profileFeedback}</p>
              <div className="mt-2 p-2 bg-white border border-[#EDF1F4] rounded-[4px]">
                <p className="text-[12px] font-medium text-[#4C4C4C]">PSTR Raised</p>
                <p className="text-[12px] text-[#4C4C4C]">{responseData.pstrRaised}</p>
                {responseData.comment && (
                  <div className="mt-2">
                    <p className="text-[10px] text-[#AFAFAF]">Comment</p>
                    <p className="text-[12px] text-[#4C4C4C]">{responseData.comment}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Branch Response Form Component
function BranchResponseForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    contactedCustomer: 'No',
    reasonNotContacting: '',
    customerOwnedTransaction: 'Yes',
    customerStanceFile: null,
    customerStanceFileName: '',
    providedEvidence: 'Yes',
    evidenceFile: null,
    evidenceFileName: '',
    performedKYC: 'No',
    kycReason: '',
    profileFeedback: 'Un-Satisfactory',
    pstrRaised: 'No',
    comment: '',
  });

  const stanceFileRef = useRef(null);
  const evidenceFileRef = useRef(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field, fileNameField, e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [field]: file,
        [fileNameField]: file.name,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div
      className="bg-[#FBFDFF] border border-[#EDF1F4] mt-4 relative max-h-[500px] flex flex-col"
      style={{ borderRadius: '0 14px 14px 14px' }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded transition-colors z-10"
      >
        <X className="w-5 h-5 text-[#4C4C4C]" />
      </button>

      {/* Scrollable form content */}
      <form onSubmit={handleSubmit} className="p-5 space-y-6 overflow-y-auto flex-1">
        {/* Question 1: Branch contacted the customer */}
        <div>
          <p className="text-[16px] font-medium text-[#4C4C4C] mb-3">
            Branch contacted the customer<span className="text-red-500">*</span>
          </p>
          <div className="flex items-center gap-6">
            <RadioButton
              name="contactedCustomer"
              label="Yes"
              checked={formData.contactedCustomer === 'Yes'}
              onChange={() => handleChange('contactedCustomer', 'Yes')}
            />
            <RadioButton
              name="contactedCustomer"
              label="No"
              checked={formData.contactedCustomer === 'No'}
              onChange={() => handleChange('contactedCustomer', 'No')}
            />
          </div>
          {formData.contactedCustomer === 'No' && (
            <div className="mt-3 ml-4">
              <p className="text-[12px] text-[#4C4C4C] mb-2">
                Reason for Not Contacting the Customer<span className="text-red-500">*</span>
              </p>
              <textarea
                value={formData.reasonNotContacting}
                onChange={(e) => handleChange('reasonNotContacting', e.target.value)}
                placeholder="Enter reason"
                className="w-full h-[80px] border border-[#EDF1F4] rounded-[5px] p-3 text-[14px] text-[#4C4C4C] placeholder:text-[#AFAFAF] resize-none focus:outline-none focus:border-[#2064B7]"
              />
            </div>
          )}
        </div>

        {/* Question 2: The customer owned the transaction */}
        <div>
          <p className="text-[16px] font-medium text-[#4C4C4C] mb-3">
            The customer owned the transaction<span className="text-red-500">*</span>
          </p>
          <div className="flex items-center gap-6">
            <RadioButton
              name="customerOwnedTransaction"
              label="Yes"
              checked={formData.customerOwnedTransaction === 'Yes'}
              onChange={() => handleChange('customerOwnedTransaction', 'Yes')}
            />
            <RadioButton
              name="customerOwnedTransaction"
              label="No"
              checked={formData.customerOwnedTransaction === 'No'}
              onChange={() => handleChange('customerOwnedTransaction', 'No')}
            />
          </div>
          {formData.customerOwnedTransaction === 'Yes' && (
            <div className="mt-3 ml-4">
              <p className="text-[12px] text-[#4C4C4C] mb-2">
                What is Customer Stance<span className="text-red-500">*</span>
              </p>
              <div className="flex items-center gap-3">
                <div className="h-[36px] w-[3px] bg-[#2064B7] rounded" />
                <input
                  type="file"
                  ref={stanceFileRef}
                  onChange={(e) => handleFileChange('customerStanceFile', 'customerStanceFileName', e)}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <Button
                  type="button"
                  onClick={() => stanceFileRef.current?.click()}
                  className="h-[30px] px-4 text-[12px] font-medium bg-[#2064B7] hover:bg-[#2064B7]/90 text-white rounded-[5px]"
                >
                  Choose File
                </Button>
                {formData.customerStanceFileName && (
                  <span className="text-[12px] text-[#4C4C4C]">{formData.customerStanceFileName}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Question 3: Customer Provided the Evidence */}
        <div>
          <p className="text-[16px] font-medium text-[#4C4C4C] mb-3">
            Customer Provided the Evidence?<span className="text-red-500">*</span>
          </p>
          <div className="flex items-center gap-6">
            <RadioButton
              name="providedEvidence"
              label="Yes"
              checked={formData.providedEvidence === 'Yes'}
              onChange={() => handleChange('providedEvidence', 'Yes')}
            />
            <RadioButton
              name="providedEvidence"
              label="No"
              checked={formData.providedEvidence === 'No'}
              onChange={() => handleChange('providedEvidence', 'No')}
            />
          </div>
          {formData.providedEvidence === 'Yes' && (
            <div className="mt-3 ml-4">
              <p className="text-[12px] text-[#4C4C4C] mb-2">
                Is provided evidence seems original<span className="text-red-500">*</span>
              </p>
              <div className="flex items-center gap-3">
                <div className="h-[36px] w-[3px] bg-[#2064B7] rounded" />
                <input
                  type="file"
                  ref={evidenceFileRef}
                  onChange={(e) => handleFileChange('evidenceFile', 'evidenceFileName', e)}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <Button
                  type="button"
                  onClick={() => evidenceFileRef.current?.click()}
                  className="h-[30px] px-4 text-[12px] font-medium bg-[#2064B7] hover:bg-[#2064B7]/90 text-white rounded-[5px]"
                >
                  Choose File
                </Button>
                {formData.evidenceFileName && (
                  <span className="text-[12px] text-[#4C4C4C]">{formData.evidenceFileName}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Question 4: Did the Branch perform KYC / CDD */}
        <div>
          <p className="text-[16px] font-medium text-[#4C4C4C] mb-3">
            Did the Branch perform KYC / CDD?<span className="text-red-500">*</span>
          </p>
          <div className="flex items-center gap-6">
            <RadioButton
              name="performedKYC"
              label="Yes"
              checked={formData.performedKYC === 'Yes'}
              onChange={() => handleChange('performedKYC', 'Yes')}
            />
            <RadioButton
              name="performedKYC"
              label="No"
              checked={formData.performedKYC === 'No'}
              onChange={() => handleChange('performedKYC', 'No')}
            />
          </div>
          {formData.performedKYC === 'No' && (
            <div className="mt-3 ml-4">
              <p className="text-[12px] text-[#4C4C4C] mb-2">
                Reason for not performing KYC / CDD Exercise<span className="text-red-500">*</span>
              </p>
              <textarea
                value={formData.kycReason}
                onChange={(e) => handleChange('kycReason', e.target.value)}
                placeholder="Enter reason"
                className="w-full h-[80px] border border-[#EDF1F4] rounded-[5px] p-3 text-[14px] text-[#4C4C4C] placeholder:text-[#AFAFAF] resize-none focus:outline-none focus:border-[#2064B7]"
              />
            </div>
          )}
        </div>

        {/* Question 5: Branch feedback on the customer profile */}
        <div>
          <p className="text-[16px] font-medium text-[#4C4C4C] mb-3">
            Branch feedback on the customer profile.<span className="text-red-500">*</span>
          </p>
          <div className="flex items-center gap-6">
            <RadioButton
              name="profileFeedback"
              label="Satisfactory"
              checked={formData.profileFeedback === 'Satisfactory'}
              onChange={() => handleChange('profileFeedback', 'Satisfactory')}
            />
            <RadioButton
              name="profileFeedback"
              label="Un-Satisfactory"
              checked={formData.profileFeedback === 'Un-Satisfactory'}
              onChange={() => handleChange('profileFeedback', 'Un-Satisfactory')}
            />
          </div>

          {/* PSTR Raised sub-question */}
          <div className="mt-4 ml-4 p-4 border border-[#EDF1F4] rounded-[5px] bg-white">
            <p className="text-[14px] font-medium text-[#4C4C4C] mb-2">
              PSTR Raised<span className="text-red-500">*</span>
            </p>
            <div className="flex items-center gap-6 mb-4">
              <RadioButton
                name="pstrRaised"
                label="Yes"
                checked={formData.pstrRaised === 'Yes'}
                onChange={() => handleChange('pstrRaised', 'Yes')}
              />
              <RadioButton
                name="pstrRaised"
                label="No"
                checked={formData.pstrRaised === 'No'}
                onChange={() => handleChange('pstrRaised', 'No')}
              />
            </div>
            <p className="text-[12px] text-[#4C4C4C] mb-2">
              Add Comment<span className="text-red-500">*</span>
            </p>
            <textarea
              value={formData.comment}
              onChange={(e) => handleChange('comment', e.target.value)}
              placeholder="Enter Comment"
              className="w-full h-[60px] border border-[#EDF1F4] rounded-[5px] p-3 text-[14px] text-[#4C4C4C] placeholder:text-[#AFAFAF] resize-none focus:outline-none focus:border-[#2064B7]"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 pb-2">
          <Button
            type="submit"
            className="h-[40px] px-8 text-[14px] font-medium bg-[#2064B7] hover:bg-[#2064B7]/90 text-white rounded-[20px]"
          >
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}

// Demo response data for showing the full cycle
const DEMO_RESPONSE_DATA = {
  contactedCustomer: 'No',
  reasonNotContacting: 'Customer was not reachable on the registered phone number.',
  customerOwnedTransaction: 'Yes',
  customerStanceFileName: 'CustomerStatement.pdf',
  providedEvidence: 'Yes',
  evidenceFileName: 'Evidence.pdf',
  performedKYC: 'No',
  kycReason: 'Customer did not visit the branch for verification.',
  profileFeedback: 'Un-Satisfactory',
  pstrRaised: 'No',
  comment: 'Customer profile shows suspicious activity patterns.',
};

// ============================================================================
// NEW FULL TIMELINE VIEW COMPONENTS (for cases 3, 4, 5)
// ============================================================================

// Timeline Step Component with Submit Response button (New Design)
function FullTimelineStep({
  title,
  datetime,
  isActive = true,
  isLast = false,
  showLine = true,
  showSubmitButton = false,
  onSubmitClick,
  canSubmit = false,
}) {
  return (
    <div className="relative">
      <div className="flex items-start gap-4">
        {/* Circle indicator */}
        <div className="relative flex-shrink-0">
          <div className={`w-[38px] h-[38px] rounded-full border-[3px] flex items-center justify-center ${
            isActive ? 'border-[#2064B7] bg-white' : 'border-[#FFE0DE] bg-white'
          }`}>
            <div className={`w-[20px] h-[20px] rounded-full ${
              isActive ? 'bg-[#2064B7]' : 'bg-[#FFE0DE]'
            }`} />
          </div>
          {/* Vertical line */}
          {showLine && !isLast && (
            <div className="absolute left-1/2 top-[38px] w-[2px] h-[60px] bg-[#DAE1E7] -translate-x-1/2" />
          )}
        </div>
        {/* Content + Button in same row */}
        <div className="flex-1 flex items-center justify-between pt-1">
          <div>
            <p className="text-[16px] font-medium text-[#4C4C4C] font-['Jost',sans-serif]">{title}</p>
            <p className="text-[10px] text-[#AFAFAF] font-medium mt-0.5">{datetime}</p>
          </div>
          {/* Submit Response Button - aligned to right */}
          {showSubmitButton && (
            <Button
              onClick={onSubmitClick}
              disabled={!canSubmit}
              className={`h-[32px] px-4 text-[14px] font-medium rounded-[20px] flex items-center gap-2 ${
                canSubmit
                  ? 'bg-[#2064B7] hover:bg-[#2064B7]/90 text-white'
                  : 'bg-[#AFAFAF] text-white cursor-not-allowed'
              }`}
            >
              <SubmitResponseIcon />
              Submit Response
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Member Bank Timeline Step (New Design)
function MemberBankStep({
  title,
  datetime,
  isActive = true,
  isLast = false,
  showLine = true,
  hasChildren = false,
  isExpanded = false,
  onToggle,
  children,
}) {
  return (
    <div className="relative">
      <div className="flex items-start gap-4">
        {/* Circle indicator */}
        <div className="relative flex-shrink-0">
          <div className={`w-[38px] h-[38px] rounded-full border-[3px] flex items-center justify-center ${
            isActive ? 'border-[#2064B7] bg-white' : 'border-[#DAE1E7] bg-white'
          }`}>
            <div className={`w-[20px] h-[20px] rounded-full ${
              isActive ? 'bg-[#2064B7]' : 'bg-[#DAE1E7]'
            }`} />
          </div>
          {/* Vertical line */}
          {showLine && !isLast && (
            <div className="absolute left-1/2 top-[38px] w-[2px] h-[60px] bg-[#DAE1E7] -translate-x-1/2" />
          )}
        </div>
        {/* Content */}
        <div className="flex-1 pt-1">
          <div className="flex items-center gap-2">
            <p className="text-[16px] font-medium text-[#4C4C4C] font-['Jost',sans-serif]">{title}</p>
            {hasChildren && (
              <button onClick={onToggle} className="p-1 hover:bg-gray-100 rounded">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
          <p className="text-[10px] text-[#AFAFAF] font-medium mt-0.5">{datetime}</p>
        </div>
      </div>
      {/* Child nodes for layering */}
      {hasChildren && isExpanded && children && (
        <div className="ml-[50px] mt-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CASE IDs that use NEW FULL TIMELINE DESIGN
// ============================================================================
const FULL_TIMELINE_CASE_IDS = ['3', '4', '5'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function FTDHBranchDetailPage({ currentRole = 'branch_user' }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find the case data
  const caseData = useMemo(() => {
    return MOCK_FTDH_CASES.find(c => c.id === id) || MOCK_FTDH_CASES[0];
  }, [id]);

  // Determine which design to use
  const useFullTimelineDesign = FULL_TIMELINE_CASE_IDS.includes(id);

  // State
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Response history - for simple view: array, for full timeline: by step
  const [responseHistory, setResponseHistory] = useState([]);
  const [responseHistoryByStep, setResponseHistoryByStep] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const [expandedBanks, setExpandedBanks] = useState({});

  // Get branch communication state
  const bc = caseData?.branchCommunication || {};
  const mbc = caseData?.memberBankCommunication || {};
  const init = caseData?.initialData || {};

  // For demo case (id === '6'), show pre-populated response history
  const isDemoCase = id === '6';
  const demoResponseHistory = useMemo(() => {
    if (!isDemoCase) return [];
    return [
      { status: 'sent', datetime: '03/06/2025 10:50 AM', responseData: DEMO_RESPONSE_DATA },
      { status: 'rejected', datetime: '07/06/2025 11:50 AM', responseData: DEMO_RESPONSE_DATA },
      { status: 'sent', datetime: '03/06/2025 10:50 AM', responseData: DEMO_RESPONSE_DATA },
      { status: 'accepted', datetime: '07/06/2025 11:50 AM', responseData: DEMO_RESPONSE_DATA },
    ];
  }, [isDemoCase]);

  // Combined response history for simple view
  const allResponses = isDemoCase ? demoResponseHistory : responseHistory;

  // Get last response status for simple view
  const lastResponse = allResponses.length > 0 ? allResponses[allResponses.length - 1] : null;
  const canSubmitResponse = !lastResponse || lastResponse.status === 'rejected';

  // Determine which intimation type to show for simple view
  const getIntimationType = () => {
    if (bc.thirdReminderSent) return '3rd Reminder';
    if (bc.secondReminderSent) return '2nd Reminder';
    if (bc.firstReminderSent) return '1st Reminder';
    return 'Initial Intimation';
  };

  const getIntimationDate = () => {
    if (bc.thirdReminderSent && bc.thirdReminderDate) return formatDateTime(bc.thirdReminderDate);
    if (bc.secondReminderSent && bc.secondReminderDate) return formatDateTime(bc.secondReminderDate);
    if (bc.firstReminderSent && bc.firstReminderDate) return formatDateTime(bc.firstReminderDate);
    return bc.initialIntimationDate ? formatDateTime(bc.initialIntimationDate) : '02/06/2025 10:50 AM';
  };

  const intimationType = getIntimationType();
  const intimationDate = getIntimationDate();

  // Build timeline steps for full timeline view
  const branchTimelineSteps = useMemo(() => {
    if (!useFullTimelineDesign) return [];

    const steps = [];

    // Initial Intimation
    steps.push({
      key: 'initial',
      title: 'Initial Intimation',
      datetime: bc.initialIntimationDate ? formatDateTime(bc.initialIntimationDate) : '02/06/2025 10:50 AM',
      isActive: true,
    });

    // 1st Reminder
    if (bc.firstReminderSent) {
      steps.push({
        key: '1st_reminder',
        title: '1st Reminder',
        datetime: bc.firstReminderDate ? formatDateTime(bc.firstReminderDate) : '',
        isActive: true,
      });
    }

    // 2nd Reminder
    if (bc.secondReminderSent) {
      steps.push({
        key: '2nd_reminder',
        title: '2nd Reminder',
        datetime: bc.secondReminderDate ? formatDateTime(bc.secondReminderDate) : '',
        isActive: true,
      });
    }

    // 3rd Reminder
    if (bc.thirdReminderSent) {
      steps.push({
        key: '3rd_reminder',
        title: '3rd Reminder',
        datetime: bc.thirdReminderDate ? formatDateTime(bc.thirdReminderDate) : '',
        isActive: true,
      });
    }

    // Business Consideration
    if (bc.businessConsiderationSubmitted) {
      steps.push({
        key: 'business_consideration',
        title: 'Business Consideration',
        datetime: bc.businessConsiderationDate ? formatDateTime(bc.businessConsiderationDate) : '',
        isActive: true,
      });
    }

    return steps;
  }, [bc, useFullTimelineDesign]);

  // Check if member bank has activity (for full timeline view)
  const hasMemberBankActivity = useFullTimelineDesign && (mbc.initialSubmissionSent || mbc.feedbackReceived === 'Yes');
  const hasLayering = caseData?.actionsTaken?.fundsLayering;

  // Build member bank timeline steps
  const memberBankTimelineSteps = useMemo(() => {
    if (!hasMemberBankActivity) return [];

    const steps = [];
    const bankName = mbc.fiName || init.receivingBank?.split('(')[1]?.replace(')', '') || 'Member Bank';

    if (hasLayering) {
      steps.push({
        key: 'mcb',
        title: 'MCB',
        datetime: mbc.initialSubmissionDate ? formatDateTime(mbc.initialSubmissionDate) : '',
        isActive: true,
        hasChildren: true,
        children: [
          { key: 'abl', title: 'ABL', datetime: formatDateTime(mbc.firstReminderDate || new Date()), isActive: true },
          { key: 'ubl', title: 'UBL', datetime: formatDateTime(mbc.secondReminderDate || new Date()), isActive: true },
        ],
      });
    } else {
      steps.push({
        key: 'member_bank',
        title: bankName,
        datetime: mbc.initialSubmissionDate ? formatDateTime(mbc.initialSubmissionDate) : '',
        isActive: mbc.feedbackReceived === 'Yes',
      });

      if (mbc.firstReminderSent) {
        steps.push({
          key: 'mb_1st_reminder',
          title: '1st Reminder',
          datetime: mbc.firstReminderDate ? formatDateTime(mbc.firstReminderDate) : '',
          isActive: mbc.feedback1stReminder === 'Yes',
        });
      }

      if (mbc.secondReminderSent) {
        steps.push({
          key: 'mb_2nd_reminder',
          title: '2nd Reminder',
          datetime: mbc.secondReminderDate ? formatDateTime(mbc.secondReminderDate) : '',
          isActive: mbc.feedback2ndReminder === 'Yes',
        });
      }

      if (mbc.thirdReminderSent) {
        steps.push({
          key: 'mb_3rd_reminder',
          title: '3rd Reminder',
          datetime: mbc.thirdReminderDate ? formatDateTime(mbc.thirdReminderDate) : '',
          isActive: mbc.feedback3rdReminder === 'Yes',
        });
      }
    }

    return steps;
  }, [mbc, init, hasMemberBankActivity, hasLayering]);

  // Handle form submission for SIMPLE view
  const handleSimpleSubmitResponse = useCallback((formData) => {
    setShowResponseForm(false);
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);

      const now = new Date();
      const datetime = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

      setResponseHistory(prev => [...prev, {
        status: 'sent',
        datetime,
        responseData: formData,
      }]);
    }, 2000);
  }, []);

  // Handle form submission for FULL TIMELINE view
  const handleTimelineSubmitResponse = useCallback((formData) => {
    const stepKey = activeStep;
    setShowResponseForm(false);
    setActiveStep(null);
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);

      const now = new Date();
      const datetime = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

      setResponseHistoryByStep(prev => ({
        ...prev,
        [stepKey]: [...(prev[stepKey] || []), {
          status: 'sent',
          datetime,
          responseData: formData,
        }],
      }));
    }, 2000);
  }, [activeStep]);

  const handleSuccessClose = () => {
    setShowSuccess(false);
  };

  const toggleCardExpansion = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleBankExpansion = (bankKey) => {
    setExpandedBanks(prev => ({
      ...prev,
      [bankKey]: !prev[bankKey],
    }));
  };

  const openFormForStep = (stepKey) => {
    setActiveStep(stepKey);
    setShowResponseForm(true);
  };

  // Check if can submit for a specific step (full timeline view)
  const canSubmitForStep = (stepKey) => {
    const responses = responseHistoryByStep[stepKey] || [];
    const last = responses.length > 0 ? responses[responses.length - 1] : null;
    return !last || last.status === 'rejected';
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col font-['Inter',sans-serif] relative">
      {/* Main Card */}
      <div className={`flex-1 bg-white border-2 border-[#DAE1E7] rounded-[15px] overflow-hidden flex flex-col transition-opacity ${
        isSubmitting ? 'opacity-50' : 'opacity-100'
      }`}>
        {/* Blue Header */}
        <div className="bg-[#2064B7] px-6 py-4 shrink-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/ftdh/branch')}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            {/* Case Info Grid */}
            <div className="flex items-start gap-8 flex-1">
              <div>
                <p className="text-[12px] text-white/50 font-medium">Dispute ID</p>
                <p className="text-[16px] text-white font-medium mt-1">
                  {init.disputeId?.replace('FTDH-INW-', 'IBFT-MMBL-') || 'IBFT-MMBL-250605-344567'}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-white/50 font-medium">Sender</p>
                <p className="text-[16px] text-white font-medium mt-1">
                  {init.sendingBank?.split('(')[1]?.replace(')', '') || init.sendingBank?.split(' ')[0] || 'MMBL'}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-white/50 font-medium">Beneficiary</p>
                <p className="text-[16px] text-white font-medium mt-1">
                  {init.receivingBank?.split('(')[1]?.replace(')', '') || init.receivingBank?.split(' ')[0] || 'HBL'}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-white/50 font-medium">Sender Account</p>
                <p className="text-[14px] text-white font-medium mt-1 font-mono">
                  {init.senderAccount || '328152075045435'}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-white/50 font-medium">Beneficiary Account</p>
                <p className="text-[14px] text-white font-medium mt-1 font-mono">
                  {init.beneficiaryAccount || '001001001001001'}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-white/50 font-medium">Trx Date & Time</p>
                <p className="text-[14px] text-white font-medium mt-1">
                  {init.transactionDateTime ? formatDateTime(init.transactionDateTime) : '02/06/2025 10:49:18'}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-white/50 font-medium">Stan</p>
                <p className="text-[16px] text-white font-medium mt-1">
                  {init.stan || '345675'}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-white/50 font-medium">Trx Amount</p>
                <p className="text-[14px] text-white font-semibold mt-1">
                  {init.amount ? formatAmount(init.amount) : 'PKR 50,000'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area - Two Columns */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Communication with Branch */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-[20px] font-semibold text-[#4C4C4C] mb-6">Communication with Branch</h2>

            {/* ============ SIMPLE VIEW (Original Design) ============ */}
            {!useFullTimelineDesign && (
              <>
                <SimpleTimelineStep
                  title={intimationType}
                  datetime={intimationDate}
                  isActive={true}
                  isLast={true}
                  showLine={false}
                  showSubmitButton={true}
                  onSubmitClick={() => setShowResponseForm(true)}
                  canSubmit={canSubmitResponse && !showResponseForm}
                />

                {showResponseForm && (
                  <div className="ml-[54px] mt-4">
                    <BranchResponseForm
                      onSubmit={handleSimpleSubmitResponse}
                      onClose={() => setShowResponseForm(false)}
                    />
                  </div>
                )}

                {allResponses.length > 0 && !showResponseForm && (
                  <div className="ml-[54px] mt-4 space-y-3">
                    {allResponses.map((response, index) => (
                      <ResponseCard
                        key={index}
                        status={response.status}
                        datetime={response.datetime}
                        responseData={response.responseData}
                        isExpanded={expandedCards[index]}
                        onToggle={() => toggleCardExpansion(index)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ============ FULL TIMELINE VIEW (New Design) ============ */}
            {useFullTimelineDesign && (
              <div className="space-y-[40px]">
                {branchTimelineSteps.map((step, index) => {
                  const isLast = index === branchTimelineSteps.length - 1;
                  const canSubmit = canSubmitForStep(step.key);
                  const isFormOpenForThisStep = showResponseForm && activeStep === step.key;

                  return (
                    <div key={step.key}>
                      <FullTimelineStep
                        title={step.title}
                        datetime={step.datetime}
                        isActive={step.isActive}
                        isLast={isLast}
                        showLine={!isLast}
                        showSubmitButton={true} // All steps have the button
                        onSubmitClick={() => openFormForStep(step.key)}
                        canSubmit={isLast && canSubmit && !showResponseForm} // Only enable on last step
                      />

                      {isFormOpenForThisStep && (
                        <BranchResponseForm
                          onSubmit={handleTimelineSubmitResponse}
                          onClose={() => {
                            setShowResponseForm(false);
                            setActiveStep(null);
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className="w-[2px] bg-[#DAE1E7]" />

          {/* Right Column - Communication with Member Bank */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className={`text-[20px] font-semibold mb-6 ${
              hasMemberBankActivity ? 'text-[#4C4C4C]' : 'text-[#AFAFAF]'
            }`}>
              Communication with Member Bank
            </h2>

            {/* Member Bank Timeline (only for full timeline view cases) */}
            {hasMemberBankActivity && memberBankTimelineSteps.length > 0 && (
              <div className="space-y-[40px]">
                {memberBankTimelineSteps.map((step, index) => {
                  const isLast = index === memberBankTimelineSteps.length - 1;

                  if (step.hasChildren) {
                    return (
                      <MemberBankStep
                        key={step.key}
                        title={step.title}
                        datetime={step.datetime}
                        isActive={step.isActive}
                        isLast={isLast}
                        showLine={!isLast}
                        hasChildren={true}
                        isExpanded={expandedBanks[step.key]}
                        onToggle={() => toggleBankExpansion(step.key)}
                      >
                        {step.children?.map((child, childIndex) => (
                          <MemberBankStep
                            key={child.key}
                            title={child.title}
                            datetime={child.datetime}
                            isActive={child.isActive}
                            isLast={childIndex === step.children.length - 1}
                            showLine={childIndex !== step.children.length - 1}
                          />
                        ))}
                      </MemberBankStep>
                    );
                  }

                  return (
                    <MemberBankStep
                      key={step.key}
                      title={step.title}
                      datetime={step.datetime}
                      isActive={step.isActive}
                      isLast={isLast}
                      showLine={!isLast}
                    />
                  );
                })}
              </div>
            )}

            {/* Empty state for simple view or when no member bank activity */}
            {!hasMemberBankActivity && (
              <p className="text-[14px] text-[#AFAFAF]">
                {useFullTimelineDesign ? 'No member bank communication yet.' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-4 shrink-0">
        <span>
          © 2025, Made by{' '}
          <span className="text-[#2064B7] font-medium">ProofLine</span>
        </span>
        <div className="flex gap-4">
          <a href="#" className="text-[#2064B7] hover:underline">License</a>
          <a href="#" className="text-[#2064B7] hover:underline">Support</a>
        </div>
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] bg-black/30 flex items-center justify-center">
          <LoadingDots />
        </div>
      )}

      {/* Success Dialog */}
      <SuccessDialog open={showSuccess} onClose={handleSuccessClose} />
    </div>
  );
}

export default FTDHBranchDetailPage;
