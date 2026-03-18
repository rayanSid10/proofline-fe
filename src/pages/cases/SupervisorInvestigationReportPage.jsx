import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle2, Download, XCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ibmbAPI } from '@/api/ibmb';
import { InvestigationReport } from '@/components/reports/InvestigationReport';
import { buildReportFileName, downloadElementAsPdf } from '@/utils/reportPdf';

const ALLOWED_SIGNATURE_MIME_TYPES = ['image/png', 'image/jpeg'];
const ALLOWED_SIGNATURE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

function isAllowedSignatureFile(file) {
  if (!file) return false;

  const name = String(file.name || '').toLowerCase();
  const hasAllowedExtension = ALLOWED_SIGNATURE_EXTENSIONS.some((ext) => name.endsWith(ext));
  const mime = String(file.type || '').toLowerCase();
  const hasAllowedMime = ALLOWED_SIGNATURE_MIME_TYPES.includes(mime);

  // Allow by extension fallback because some browsers/filesystems may not send MIME reliably.
  return hasAllowedExtension || hasAllowedMime;
}

export function SupervisorInvestigationReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [investigation, setInvestigation] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [signatureFile, setSignatureFile] = useState(null);
  const [typedSignature, setTypedSignature] = useState('');
  const [signatureMode, setSignatureMode] = useState('upload');
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const signatureCanvasRef = useRef(null);
  const exportRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setLoadError(null);

        const [caseRes, invRes, filesRes] = await Promise.all([
          ibmbAPI.getCase(id),
          ibmbAPI.getInvestigation(id),
          ibmbAPI.listInvestigationFiles(id).catch(() => ({ data: [] })),
        ]);

        if (cancelled) return;

        setCaseData(caseRes.data);
        setInvestigation(invRes.data);
        setUploadedFiles(
          (filesRes.data || []).map((file) => ({
            id: file.id,
            name: file.original_filename,
            file_type: file.file_type,
            file: file.file,
            file_url: file.file_url,
            url: file.url,
          }))
        );
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.response?.data?.detail || 'Failed to load supervisor report.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const submittedStatuses = ['pending_review', 'approved', 'rejected', 'closed'];
  const isSubmitted = submittedStatuses.includes(caseData?.status);
  const canDecide = caseData?.status === 'pending_review';
  const canDownloadReport = caseData?.status === 'approved' || investigation?.draftStatus === 'approved';

  const handleDownload = async () => {
    if (!exportRef.current) return;
    try {
      const fileName = buildReportFileName(investigation?.caseReferenceNo || caseData?.reference_number);
      await downloadElementAsPdf(exportRef.current, fileName);
      toast.success('Report downloaded successfully');
    } catch (err) {
      console.error('Failed to download report PDF', err);
      toast.error('Failed to download report');
    }
  };

  const getCanvasPoint = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const point = getCanvasPoint(e);
    if (!context || !point) return;

    if (e.cancelable) e.preventDefault();

    context.lineWidth = 2;
    context.lineCap = 'round';
    context.strokeStyle = '#111827';
    context.beginPath();
    context.moveTo(point.x, point.y);
    setIsDrawing(true);
  };

  const drawSignature = (e) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const point = getCanvasPoint(e);
    if (!context || !point) return;

    if (e.cancelable) e.preventDefault();

    context.lineTo(point.x, point.y);
    context.stroke();
    setHasDrawnSignature(true);
  };

  const stopDrawing = (e) => {
    if (e?.cancelable) e.preventDefault();
    setIsDrawing(false);
  };

  const clearDrawnSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  const handleApprove = async () => {
    if (signatureMode === 'upload' && !signatureFile) {
      toast.error('Upload a signature file to approve');
      return;
    }

    if (signatureMode === 'upload' && signatureFile && !isAllowedSignatureFile(signatureFile)) {
      toast.error('Only PNG, JPG, or JPEG signature files are allowed');
      return;
    }

    if (signatureMode === 'typed' && !typedSignature.trim()) {
      toast.error('Type your signature name to approve');
      return;
    }

    if (signatureMode === 'drawn' && !hasDrawnSignature) {
      toast.error('Draw a signature to approve');
      return;
    }

    try {
      setIsReviewing(true);
      const payload = new FormData();
      payload.append('action', 'approve');
      payload.append('signature_type', signatureMode);
      payload.append('approval_comment', approveNote);

      if (signatureMode === 'upload' && signatureFile) {
        payload.append('signature_file', signatureFile);
      }
      if (signatureMode === 'typed') {
        payload.append('typed_signature', typedSignature.trim());
      }
      if (signatureMode === 'drawn') {
        const canvas = signatureCanvasRef.current;
        if (canvas) payload.append('drawn_signature_data', canvas.toDataURL('image/png'));
      }

      await ibmbAPI.reviewInvestigation(id, payload, { isMultipart: true });
      toast.success('Case approved successfully');
      setShowApproveDialog(false);
      navigate(`/cases/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve case');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      setIsReviewing(true);
      await ibmbAPI.reviewInvestigation(id, {
        action: 'reject',
        rejection_reason: rejectReason.trim(),
      });
      toast.success('Case rejected and returned to investigator');
      setShowRejectDialog(false);
      navigate(`/cases/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject case');
    } finally {
      setIsReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#2064B7] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-muted-foreground">Loading supervisor report...</p>
      </div>
    );
  }

  if (loadError || !caseData || !investigation) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">{loadError || 'Case not found'}</h2>
        <Button className="mt-4" onClick={() => navigate('/cases')}>
          Back to Cases
        </Button>
      </div>
    );
  }

  if (!isSubmitted) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(`/cases/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Case
        </Button>
        <div className="rounded-xl border border-[#dae1e7] bg-white p-10 text-center space-y-2">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
          <p className="font-medium">Investigation not submitted yet</p>
          <p className="text-sm text-muted-foreground">
            Supervisor can view investigation report after investigator submits it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#dae1e7] overflow-hidden">
        <div className="bg-[#2064b7] px-4 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
              onClick={() => navigate(`/cases/${id}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Investigation Report</h2>
              <p className="text-xs text-white/80">{investigation.caseReferenceNo || caseData.reference_number}</p>
            </div>
            <StatusBadge status={caseData.status} />
          </div>

          <div className="flex items-center gap-2">
            {canDownloadReport && (
              <Button
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
            {canDecide && (
              <>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isReviewing}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
                  onClick={() => setShowApproveDialog(true)}
                  disabled={isReviewing}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>

        <InvestigationReport
          caseData={caseData}
          investigation={investigation}
          uploadedFiles={uploadedFiles}
          mode="supervisor"
        />
      </div>

      <div className="fixed -left-[99999px] top-0 z-[-1] opacity-0 pointer-events-none">
        <div ref={exportRef} className="w-[1200px] bg-white">
          <div className="rounded-xl border border-[#dae1e7] overflow-hidden">
            <div className="bg-[#2064b7] px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Investigation Report</h2>
                  <p className="text-xs text-white/80">{investigation.caseReferenceNo || caseData.reference_number}</p>
                </div>
                <StatusBadge status={caseData.status} />
              </div>
            </div>

            <InvestigationReport
              caseData={caseData}
              investigation={investigation}
              uploadedFiles={uploadedFiles}
              mode="supervisor"
              exportMode
            />
          </div>
        </div>
      </div>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve Investigation</DialogTitle>
            <DialogDescription>
              Attach your signature to save and approve this case.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="text-sm font-medium">Signature *</label>

            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant={signatureMode === 'upload' ? 'default' : 'outline'} onClick={() => setSignatureMode('upload')}>
                Upload
              </Button>
              <Button type="button" variant={signatureMode === 'typed' ? 'default' : 'outline'} onClick={() => setSignatureMode('typed')}>
                Write Name
              </Button>
              <Button type="button" variant={signatureMode === 'drawn' ? 'default' : 'outline'} onClick={() => setSignatureMode('drawn')}>
                E-Sign
              </Button>
            </div>

            {signatureMode === 'upload' && (
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-muted">
                  <Upload className="mr-2 h-4 w-4" />
                  Attach File
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && !isAllowedSignatureFile(file)) {
                        toast.error('Only PNG, JPG, or JPEG signature files are allowed');
                        e.target.value = '';
                        setSignatureFile(null);
                        return;
                      }
                      setSignatureFile(file);
                    }}
                  />
                </label>
                <span className="text-xs text-muted-foreground truncate max-w-[260px]">
                  {signatureFile?.name || 'No file selected'}
                </span>
              </div>
            )}

            {signatureMode === 'typed' && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Type your full name as signature</label>
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            )}

            {signatureMode === 'drawn' && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Draw signature using touch or mouse</label>
                <canvas
                  ref={signatureCanvasRef}
                  width={520}
                  height={160}
                  className="w-full rounded-md border bg-white touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={drawSignature}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={drawSignature}
                  onTouchEnd={stopDrawing}
                />
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={clearDrawnSignature}>
                    Clear
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">Use any one option above (Upload OR Write Name OR E-Sign).</p>

            <Textarea
              placeholder="Approval comments (optional)"
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              className="w-full min-w-0 max-h-40 overflow-y-auto overflow-x-hidden [field-sizing:fixed] resize-y"
              style={{ fieldSizing: 'fixed' }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button onClick={handleApprove} disabled={isReviewing}>Save & Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reject Investigation</DialogTitle>
            <DialogDescription>
              Provide reason before sending it back to investigator.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Enter rejection reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full min-w-0 max-h-40 overflow-y-auto overflow-x-hidden [field-sizing:fixed] resize-y"
            style={{ fieldSizing: 'fixed' }}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isReviewing}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SupervisorInvestigationReportPage;
