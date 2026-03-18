import { useState, useRef, useEffect, useCallback } from 'react';
import { Headphones, Upload, Mic, Play, Pause, Loader2, FileAudio, Trash2, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { uploadAudio, getTranscriptionStatus, deleteTranscriptionAudio } from '@/api/transcription';

const FILE_TYPE_OPTIONS = [
  { value: 'cx_call', label: 'CX Call' },
  { value: 'io_call', label: 'IO Call' },
];

const FILE_TYPE_COLORS = {
  cx_call: 'bg-blue-100 text-blue-700 border-blue-200',
  io_call: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const IN_PROGRESS_STATUSES = new Set(['pending', 'processing']);

// ─── Audio Card ────────────────────────────────────────────────────────────────
function AudioCard({ file, onRemove, onUpdate, ownerContext }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(
    Boolean(file.backendId && IN_PROGRESS_STATUSES.has(file.backendStatus) && !file.transcriptionText)
  );
  const [transcription, setTranscription] = useState(file.transcriptionText || null);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const pollRef = useRef(null);

  // Poll for transcription status
  const startPolling = useCallback((audioId) => {
    // Clear any existing poll
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const result = await getTranscriptionStatus(audioId);

        if (result.status === 'completed' && result.transcription) {
          const text = result.transcription.text;
          setTranscription(text);
          setIsTranscribing(false);
          // Persist on file object so it survives sidebar close/reopen
          onUpdate(file.id, { transcriptionText: text, backendStatus: 'completed' });
          clearInterval(pollRef.current);
          pollRef.current = null;
        } else if (result.status === 'failed') {
          const errMsg = result.error_detail || 'Transcription failed.';
          setError(errMsg);
          setIsTranscribing(false);
          onUpdate(file.id, { backendStatus: 'failed' });
          clearInterval(pollRef.current);
          pollRef.current = null;
        } else if (IN_PROGRESS_STATUSES.has(result.status)) {
          // Keep parent state in sync so rerenders don't accidentally stop polling.
          onUpdate(file.id, { backendStatus: result.status });
        }
        // else: still processing — keep polling
      } catch {
        setError('Failed to check transcription status.');
        setIsTranscribing(false);
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 4000); // Poll every 4 seconds
  }, [file.id, onUpdate]);

  // Resume polling on mount if file was already submitted and still processing
  useEffect(() => {
    if (file.backendId && IN_PROGRESS_STATUSES.has(file.backendStatus) && !file.transcriptionText) {
      startPolling(file.backendId);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [file.backendId, file.backendStatus, file.transcriptionText, startPolling]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTranscribe = async () => {
    if (!file.rawFile) {
      setError('Original file is not available in this session. Please upload again to regenerate transcription.');
      return;
    }

    setIsTranscribing(true);
    setError(null);
    try {
      const result = await uploadAudio(file.rawFile, file.type, ownerContext);
      // Persist backend ID on file object
      onUpdate(file.id, { backendId: result.id, backendStatus: result.status });

      if (result.status === 'failed') {
        setError(result.error_detail || 'Submission to transcription service failed.');
        setIsTranscribing(false);
        return;
      }

      // Start polling for result
      startPolling(result.id);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Upload failed.';
      setError(detail);
      setIsTranscribing(false);
    }
  };

  return (
    <Card className="border border-gray-200 shadow-none">
      <CardContent className="p-3 space-y-3">
        {/* File Info Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#2064B7]/10 flex items-center justify-center flex-shrink-0">
              <FileAudio className="w-4 h-4 text-[#2064B7]" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-[11px] text-gray-500">{file.size}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${FILE_TYPE_COLORS[file.type] || ''}`}>
              {FILE_TYPE_OPTIONS.find(o => o.value === file.type)?.label || file.type}
            </Badge>
            <button
              onClick={() => onRemove(file.id)}
              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Audio Player */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-[#2064B7] flex items-center justify-center text-white hover:bg-[#1a53a0] transition-colors flex-shrink-0"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <audio
            ref={audioRef}
            src={file.url}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#2064B7]/40 rounded-full" style={{ width: isPlaying ? '60%' : '0%', transition: 'width 1s linear' }} />
          </div>
        </div>

        {/* Transcribe Button */}
        {!transcription && !error && (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-[12px] gap-1.5 border-dashed border-[#2064B7]/30 text-[#2064B7] hover:bg-[#2064B7]/5"
            onClick={handleTranscribe}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Transcribing...
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                Generate Transcription
              </>
            )}
          </Button>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[12px] text-red-700">{error}</p>
              <button
                onClick={() => { setError(null); }}
                className="text-[11px] text-red-500 underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Transcription Text */}
        {transcription && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#2064B7] uppercase tracking-wide">Transcription</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-[200px] overflow-y-auto">
              <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap">{transcription}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main TranscriptionPanel ───────────────────────────────────────────────────
export function TranscriptionPanel({ open, onOpenChange, audioFiles, setAudioFiles, ownerContext = null }) {
  const [selectedType, setSelectedType] = useState('cx_call');
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newFile = {
      id: Date.now(),
      name: file.name,
      size: `${Math.round(file.size / 1024)} KB`,
      type: selectedType,
      url: URL.createObjectURL(file),
      rawFile: file,              // keep raw File for backend upload
      backendId: null,            // set after upload API returns
      backendStatus: null,
      transcriptionText: null,    // persisted transcription text
      uploadedAt: new Date(),
    };
    setAudioFiles(prev => [newFile, ...prev]);
    e.target.value = '';
  };

  const removeFile = async (id) => {
    const target = audioFiles.find(f => f.id === id);
    if (target?.backendId) {
      try {
        await deleteTranscriptionAudio(target.backendId);
      } catch {
        return;
      }
    }
    setAudioFiles(prev => prev.filter(f => f.id !== id));
  };

  // Update a file's properties (called by AudioCard to persist state)
  const updateFile = useCallback((id, updates) => {
    setAudioFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, [setAudioFiles]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[480px] sm:max-w-[480px] p-0 flex flex-col"
        showCloseButton={false}
      >
        {/* Panel Header */}
        <div className="bg-[#2064B7] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-white text-[16px] font-bold">Call Transcriptions</SheetTitle>
              <SheetDescription className="text-white/60 text-[11px]">Upload recordings & generate transcriptions</SheetDescription>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Section */}
        <div className="px-4 pt-4 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[12px] font-medium text-gray-600">Call Type:</span>
            <div className="flex gap-1">
              {FILE_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedType(opt.value)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    selectedType === opt.value
                      ? 'bg-[#2064B7] text-white border-[#2064B7]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#2064B7]/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 hover:border-[#2064B7]/40 rounded-lg py-3 flex flex-col items-center gap-1 transition-colors hover:bg-[#2064B7]/[0.02]"
          >
            <Upload className="w-5 h-5 text-gray-400" />
            <span className="text-[12px] text-gray-500">Click to upload audio file</span>
            <span className="text-[10px] text-gray-400">.mp3, .wav</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Audio Files List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {audioFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Headphones className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-[13px] font-medium text-gray-400">No audio files yet</p>
              <p className="text-[11px] text-gray-400 mt-1">Upload a call recording to get started</p>
            </div>
          ) : (
            audioFiles.map(file => (
              <AudioCard
                key={file.id}
                file={file}
                onRemove={removeFile}
                onUpdate={updateFile}
                ownerContext={ownerContext}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default TranscriptionPanel;
