import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Download, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SubmissionProgressBar } from '@/components/modals/SubmissionProgressBar';
import { SubmissionSuccessDialog } from '@/components/modals/SubmissionSuccessDialog';
import { ibmbAPI } from '@/api/ibmb';
import { InvestigationReport } from '@/components/reports/InvestigationReport';
import { buildReportFileName, downloadElementAsPdf } from '@/utils/reportPdf';

export function InvestigationReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [investigation, setInvestigation] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
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
          setLoadError(err.response?.data?.detail || 'Failed to load investigation data.');
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

  const isAlreadySubmitted =
    investigation?.draftStatus === 'submitted' ||
    caseData?.status === 'pending_review' ||
    caseData?.status === 'approved' ||
    caseData?.status === 'closed';

  const backTarget = isAlreadySubmitted ? `/cases/${id}` : `/cases/${id}/investigation`;
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

  const handleSubmit = async () => {
    if (isAlreadySubmitted) return;

    setIsSubmitting(true);
    setSubmissionStep(1);
    try {
      await ibmbAPI.submitInvestigation(id);
      for (let i = 2; i <= 6; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 400));
        setSubmissionStep(i);
      }
      await new Promise((r) => setTimeout(r, 300));

      setInvestigation((prev) => (prev ? { ...prev, draftStatus: 'submitted' } : prev));
      setCaseData((prev) => (prev ? { ...prev, status: 'pending_review', investigation_status: 'pending_review' } : prev));

      setIsSubmitting(false);
      setShowSuccess(true);
    } catch (err) {
      setIsSubmitting(false);
      setSubmissionStep(0);
      toast.error('Submission failed', {
        description: err.response?.data?.detail || 'Please try again.',
      });
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setSubmissionStep(0);
    toast.success('Investigation report submitted for supervisor review');
    navigate('/cases');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#2064B7] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-muted-foreground">Loading review...</p>
      </div>
    );
  }

  if (loadError || !caseData) {
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

  if (!investigation) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(`/cases/${id}/investigation`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Investigation Form
        </Button>
        <Card>
          <CardContent className="py-10 text-center space-y-2">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
            <p className="font-medium">Draft report data not found</p>
            <p className="text-sm text-muted-foreground">
              Please complete the investigation form first, then open review again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 bg-[#2A2A2A]/90 flex items-center justify-center z-[100]">
          <SubmissionProgressBar currentStep={submissionStep} totalSteps={6} />
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-xl border border-[#dae1e7] overflow-hidden">
          <div className="bg-[#2064b7] px-4 py-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
                onClick={() => navigate(backTarget)}
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
              {!isAlreadySubmitted && (
                <Button
                  className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
                  onClick={handleSubmit}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit For Review
                </Button>
              )}
            </div>
          </div>

          <InvestigationReport
            caseData={caseData}
            investigation={investigation}
            uploadedFiles={uploadedFiles}
            mode="io-preview"
          />
        </div>
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
              mode="io-preview"
              exportMode
            />
          </div>
        </div>
      </div>

      <SubmissionSuccessDialog open={showSuccess} onClose={handleSuccessClose} />
    </>
  );
}

export default InvestigationReviewPage;
