import { useState, useRef } from 'react';
import { Upload, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getAllCases, addImportedCases } from '@/data/caseStorage';
import { parseCaseImportCsv, buildCasesFromImportRows } from '@/utils/caseImport';

function toGoogleSheetCsvUrl(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('docs.google.com')) return url;
    if (!u.pathname.includes('/spreadsheets/')) return url;

    const parts = u.pathname.split('/');
    const dIndex = parts.findIndex((p) => p === 'd');
    const sheetId = dIndex >= 0 ? parts[dIndex + 1] : '';
    if (!sheetId) return url;

    const gid = u.searchParams.get('gid') || '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  } catch {
    return url;
  }
}

export function ImportModal({ open, onOpenChange, onImported }) {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
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
    setLink('');
    setIsImporting(false);
    setActiveTab('upload');
    onOpenChange(false);
  };

  const processCsvText = async (csvText) => {
    const { rows, errors, totalRows } = parseCaseImportCsv(csvText);
    const existingCases = getAllCases();
    const { importedCases, skipped } = buildCasesFromImportRows(rows, existingCases);
    const { addedCases } = addImportedCases(importedCases);

    const failed = errors.length;
    const success = Math.max(rows.length - skipped, 0);

    if (failed > 0) {
      toast.warning(`${addedCases} Cases uploaded successfully`);
    } else {
      toast.success(`${addedCases} Cases uploaded successfully`);
    }

    if (onImported) {
      onImported({ totalRows, success, failed, skipped, addedCases, createdCases: importedCases.length, errors });
    }
  };

  const handleUploadImport = async () => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Unsupported file format', {
        description: 'Demo import currently supports CSV files only.',
      });
      return;
    }

    setIsImporting(true);
    try {
      const csvText = await file.text();
      await processCsvText(csvText);
      handleClose();
    } catch {
      toast.error('Import failed', {
        description: 'Could not read CSV file.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleLinkImport = async () => {
    if (!link.trim()) return;

    setIsImporting(true);
    try {
      const csvUrl = toGoogleSheetCsvUrl(link.trim());
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error('fetch-failed');
      const csvText = await res.text();
      await processCsvText(csvText);
      handleClose();
    } catch {
      toast.error('Import by link failed', {
        description: 'Could not fetch CSV from link. Use direct CSV URL or upload file.',
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

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex border-b">
            <button
              type="button"
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors relative',
                activeTab === 'upload'
                  ? 'text-blue-600'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setActiveTab('upload')}
            >
              Upload
              {activeTab === 'upload' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              type="button"
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors relative',
                activeTab === 'link'
                  ? 'text-blue-600'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setActiveTab('link')}
            >
              Add Link
              {activeTab === 'link' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-6 pt-4">
          {activeTab === 'upload' ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              {/* Cloud Upload Icon */}
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
                accept=".csv,.xlsx,.xls"
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
                    CSV format supported
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="py-8 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Paste link</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!link.trim()}
                    onClick={handleLinkImport}
                  >
                    {isImporting ? 'Importing...' : 'Import'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImportModal;
