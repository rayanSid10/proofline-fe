import { useState, useRef } from 'react';
import { Upload, Link as LinkIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function ImportModal({ open, onOpenChange }) {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
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
    setActiveTab('upload');
    onOpenChange(false);
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
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />

              {file ? (
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">{file.name}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleBrowse}>
                      Change
                    </Button>
                    <Button size="sm">Upload</Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                    onClick={handleBrowse}
                  >
                    Browse
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Only Excel sheets can
                    <br />
                    be uploaded.
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
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!link.trim()}
                  >
                    Import
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
