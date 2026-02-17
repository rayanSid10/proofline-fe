import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const maskingRules = {
  card: { visibleDigits: 4, maskChar: '*', totalLength: 16 },
  account: { visibleDigits: 4, maskChar: '*', totalLength: 13 },
  cnic: { visibleDigits: 4, maskChar: '*', totalLength: 13 },
  mobile: { visibleDigits: 4, maskChar: '*', totalLength: 11 },
};

function maskValue(value, type) {
  if (!value) return '—';

  const rule = maskingRules[type] || { visibleDigits: 4, maskChar: '*' };
  const strValue = String(value);

  if (strValue.length <= rule.visibleDigits) {
    return strValue;
  }

  const maskedPart = rule.maskChar.repeat(strValue.length - rule.visibleDigits);
  const visiblePart = strValue.slice(-rule.visibleDigits);

  return maskedPart + visiblePart;
}

export function DataMasker({
  value,
  type = 'account',
  showFull = false,
  allowToggle = false,
  className,
}) {
  const [isRevealed, setIsRevealed] = useState(showFull);

  const displayValue = isRevealed ? value : maskValue(value, type);

  if (allowToggle) {
    return (
      <span className={cn('inline-flex items-center gap-1', className)}>
        <span className="font-mono">{displayValue || '—'}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsRevealed(!isRevealed)}
        >
          {isRevealed ? (
            <EyeOff className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
        </Button>
      </span>
    );
  }

  return (
    <span className={cn('font-mono', className)}>
      {displayValue || '—'}
    </span>
  );
}

export default DataMasker;
