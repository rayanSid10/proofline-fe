import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ibmbAPI from '@/api/ibmb';

export function ImportModal({ open, onOpenChange, onImported }) {
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleClose = () => {
    setFile(null);
    setIsImporting(false);
    onOpenChange(false);
  };

  const handleUploadImport = async () => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toast.error('Unsupported file format', {
        description: 'Import supports XLSX workbook only.',
      });
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await ibmbAPI.importCasesWorkbook(formData);
      const imported = data.imported_cases || 0;
      const failed = data.failed_cases || 0;
      const errors = data.errors || [];

      if (failed > 0) {
        const preview = errors
          .slice(0, 3)
          .map((e) => `${e.case_id || 'N/A'}: ${e.field} - ${e.message}`)
          .join(' | ');
        toast.warning(`Imported ${imported} case(s) with ${failed} failed case(s).`);
        if (preview) {
          toast.info(preview);
        }
      } else {
        toast.success(`Imported ${imported} case(s) successfully.`);
      }

      if (onImported) onImported(data);
      handleClose();
    } catch (error) {
      const detail = error?.response?.data?.detail || 'Could not import workbook.';
      toast.error('Import failed', {
        description: detail,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <DialogTitle className="text-lg font-semibold">Import</DialogTitle>
          </div>
        </DialogHeader>

        {/* Upload Content */}
        <div className="px-6 pb-6 pt-4">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="text-muted-foreground/40">
              <svg
                width="80"
                height="60"
                viewBox="0 0 80 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M64 40C70.627 40 76 34.627 76 28C76 21.373 70.627 16 64 16C63.527 16 63.06 16.027 62.6 16.08C60.547 8.72 53.893 3.333 46 3.333C36.507 3.333 28.8 10.72 28.267 20.08C21.28 20.64 15.733 26.48 15.733 33.6C15.733 41.12 21.88 47.2 29.467 47.2"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M40 32V56M40 32L48 40M40 32L32 40"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileSelect}
            />

            {file ? (
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">{file.name}</p>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <Button variant="outline" size="sm" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleUploadImport}
                    disabled={isImporting}
                  >
                    {isImporting ? 'Importing...' : 'Upload'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  onClick={handleBrowse}
                >
                  Browse
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  XLSX workbook supported (Cases, Customers, Transactions)
                </p>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImportModal;
