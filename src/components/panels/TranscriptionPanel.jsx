import { useState, useRef } from 'react';
import { Headphones, Upload, Mic, Play, Pause, Loader2, FileAudio, Trash2, X } from 'lucide-react';
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
import { getRandomTranscription } from '@/data/mockTranscriptions';

const FILE_TYPE_OPTIONS = [
  { value: 'cx_call', label: 'CX Call' },
  { value: 'io_call', label: 'IO Call' },
  { value: 'frmu_call', label: 'FRMU Call' },
];

const FILE_TYPE_COLORS = {
  cx_call: 'bg-blue-100 text-blue-700 border-blue-200',
  io_call: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  frmu_call: 'bg-purple-100 text-purple-700 border-purple-200',
};

// ─── Audio Card ────────────────────────────────────────────────────────────────
function AudioCard({ file, onRemove }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState(null);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTranscribe = () => {
    setIsTranscribing(true);
    // Simulate 2-3s processing delay, then show mock transcription
    const delay = 2000 + Math.random() * 1000;
    setTimeout(() => {
      setTranscription(getRandomTranscription());
      setIsTranscribing(false);
    }, delay);
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
        {!transcription && (
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
export function TranscriptionPanel({ open, onOpenChange }) {
  const [audioFiles, setAudioFiles] = useState([]);
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
      uploadedAt: new Date(),
    };
    setAudioFiles(prev => [newFile, ...prev]);
    e.target.value = '';
  };

  const removeFile = (id) => {
    setAudioFiles(prev => prev.filter(f => f.id !== id));
  };

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
            <span className="text-[10px] text-gray-400">.mp3, .wav, .m4a</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.m4a"
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
              <AudioCard key={file.id} file={file} onRemove={removeFile} />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default TranscriptionPanel;
