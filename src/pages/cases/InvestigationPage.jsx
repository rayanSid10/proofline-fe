import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Save,
  Send,
  Upload,
  Play,
  FileAudio,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { mockCases, fraudTypes } from '@/data/mockCases';
import { getRandomTranscription } from '@/data/mockTranscriptions';

const yesNoOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const yesNoUnknownOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'Unknown' },
];

const attemptOptions = [
  { value: 'single', label: 'Single' },
  { value: 'multiple', label: 'Multiple' },
];

const stanceOptions = [
  { value: 'denies_transaction', label: 'Denies making transaction' },
  { value: 'unauthorized_access', label: 'Claims unauthorized access' },
  { value: 'shared_credentials', label: 'Admits sharing credentials' },
  { value: 'device_stolen', label: 'Device was stolen' },
  { value: 'sim_swap', label: 'Suspects SIM swap' },
  { value: 'other', label: 'Other' },
];

const rootCauses = [
  { value: 'customer_negligence', label: 'Customer Negligence' },
  { value: 'third_party_fraud', label: 'Third Party Fraud' },
  { value: 'system_vulnerability', label: 'System Vulnerability' },
  { value: 'social_engineering', label: 'Social Engineering' },
  { value: 'sim_swap_fraud', label: 'SIM Swap Fraud' },
  { value: 'unknown', label: 'Unknown' },
];

const liabilityOptions = [
  { value: 'customer', label: 'Customer' },
  { value: 'bank', label: 'Bank' },
  { value: 'shared', label: 'Shared' },
  { value: 'pending', label: 'Pending' },
];

const recommendationOptions = [
  { value: 'close_case', label: 'Close Case' },
  { value: 'refer_business', label: 'Refer to Business' },
  { value: 'compensation_review', label: 'Compensation Review' },
];

const mockAudioFiles = [
  {
    id: 1,
    filename: 'cx_call_20250201.mp3',
    duration: '5:32',
    uploadDate: '2025-02-01',
    type: 'CX Call',
    transcription: null,
  },
  {
    id: 2,
    filename: 'io_followup_20250202.mp3',
    duration: '8:15',
    uploadDate: '2025-02-02',
    type: 'IO Call',
    transcription: null,
  },
];

export function InvestigationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const caseData = mockCases.find((c) => c.id === parseInt(id));

  // Customer Contact State
  const [customerContact, setCustomerContact] = useState({
    cxCallDatetime: '',
    initialStance: '',
    initialStanceNotes: '',
    ioCallMade: false,
    ioCallDatetime: '',
    contactEstablished: false,
    customerCli: '',
    customerStanceIO: '',
  });

  // Device & Location State
  const [deviceLocation, setDeviceLocation] = useState({
    deviceChanged: '',
    locationChanged: '',
    tpinChanged: '',
    passwordChanged: '',
    biometricAttempts: '',
    loginAttempts: '',
    newBeneficiaryAdded: '',
  });

  // Actions Taken State
  const [actionsTaken, setActionsTaken] = useState({
    deviceBlocked: false,
    mbBlocked: false,
    ibBlocked: false,
    dcBlocked: false,
    simBlockRequested: false,
    ptaReported: false,
    ftdhFiled: false,
    ftdhId: '',
  });

  // Audio Evidence State
  const [audioFiles, setAudioFiles] = useState(mockAudioFiles);
  const [transcribingId, setTranscribingId] = useState(null);

  // Observations State
  const [observations, setObservations] = useState([]);

  // Conclusion State
  const [conclusion, setConclusion] = useState({
    fraudTypeConfirmed: '',
    rootCause: '',
    liability: '',
    recommendation: '',
    conclusionNotes: '',
  });

  // Dialog State
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Case not found</h2>
        <Button className="mt-4" onClick={() => navigate('/cases')}>
          Back to Cases
        </Button>
      </div>
    );
  }

  const handleTranscribe = async (fileId) => {
    setTranscribingId(fileId);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setAudioFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? { ...file, transcription: getRandomTranscription() }
          : file
      )
    );
    setTranscribingId(null);
    toast.success('Transcription completed');
  };

  const generateObservations = () => {
    const newObservations = [];

    if (deviceLocation.deviceChanged === 'yes') {
      newObservations.push({
        type: 'warning',
        text: 'New device was detected during the disputed transactions.',
      });
    }
    if (deviceLocation.locationChanged === 'yes') {
      newObservations.push({
        type: 'warning',
        text: 'Transaction location differs from customer\'s usual patterns.',
      });
    }
    if (deviceLocation.deviceChanged === 'no' && deviceLocation.locationChanged === 'no') {
      newObservations.push({
        type: 'info',
        text: 'No unauthorized access indicators observed. Device and location match customer profile.',
      });
    }
    if (deviceLocation.tpinChanged === 'yes' || deviceLocation.passwordChanged === 'yes') {
      newObservations.push({
        type: 'warning',
        text: 'Credentials were changed close to the time of disputed transactions.',
      });
    }
    if (deviceLocation.newBeneficiaryAdded === 'yes') {
      newObservations.push({
        type: 'warning',
        text: 'New beneficiary was added shortly before the disputed transactions.',
      });
    }
    if (actionsTaken.ftdhFiled) {
      newObservations.push({
        type: 'info',
        text: `FTDH has been filed${actionsTaken.ftdhId ? ` with reference ${actionsTaken.ftdhId}` : ''}.`,
      });
    }
    if (customerContact.initialStance === 'shared_credentials') {
      newObservations.push({
        type: 'critical',
        text: 'Customer admitted to sharing credentials, which may affect liability assessment.',
      });
    }

    if (newObservations.length === 0) {
      newObservations.push({
        type: 'info',
        text: 'Complete the investigation tabs to generate observations.',
      });
    }

    setObservations(newObservations);
    toast.success('Observations regenerated');
  };

  const handleSaveDraft = () => {
    toast.success('Draft saved successfully');
  };

  const handleSubmitForReview = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success('Case submitted for supervisor review');
    setShowSubmitDialog(false);
    navigate(`/cases/${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/cases/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Investigation</h2>
              <StatusBadge status={caseData.status} />
            </div>
            <p className="text-muted-foreground mt-1">
              {caseData.reference_number} &bull; {caseData.customer.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2 ml-12 sm:ml-0">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={() => setShowSubmitDialog(true)}>
            <Send className="mr-2 h-4 w-4" />
            Submit for Review
          </Button>
        </div>
      </div>

      {/* Investigation Tabs */}
      <Tabs defaultValue="customer-contact" className="space-y-4">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
          <TabsTrigger value="customer-contact">Contact</TabsTrigger>
          <TabsTrigger value="device-location">Device</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="observations">Observations</TabsTrigger>
          <TabsTrigger value="conclusion">Conclusion</TabsTrigger>
        </TabsList>

        {/* Tab 1: Customer Contact */}
        <TabsContent value="customer-contact">
          <Card>
            <CardHeader>
              <CardTitle>Customer Contact</CardTitle>
              <CardDescription>
                Record customer contact attempts and their stance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>CX Call Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={customerContact.cxCallDatetime}
                    onChange={(e) =>
                      setCustomerContact({ ...customerContact, cxCallDatetime: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Initial Customer Stance</Label>
                  <Select
                    value={customerContact.initialStance}
                    onValueChange={(value) =>
                      setCustomerContact({ ...customerContact, initialStance: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stance" />
                    </SelectTrigger>
                    <SelectContent>
                      {stanceOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Initial Stance Notes</Label>
                <Textarea
                  placeholder="Additional details about customer's initial statement..."
                  value={customerContact.initialStanceNotes}
                  onChange={(e) =>
                    setCustomerContact({ ...customerContact, initialStanceNotes: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ioCallMade"
                  checked={customerContact.ioCallMade}
                  onCheckedChange={(checked) =>
                    setCustomerContact({ ...customerContact, ioCallMade: checked })
                  }
                />
                <Label htmlFor="ioCallMade">IO Call Made</Label>
              </div>

              {customerContact.ioCallMade && (
                <div className="grid gap-6 md:grid-cols-2 pl-6 border-l-2">
                  <div className="space-y-2">
                    <Label>IO Call Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={customerContact.ioCallDatetime}
                      onChange={(e) =>
                        setCustomerContact({ ...customerContact, ioCallDatetime: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Customer CLI</Label>
                    <Input
                      placeholder="03001234567"
                      value={customerContact.customerCli}
                      onChange={(e) =>
                        setCustomerContact({ ...customerContact, customerCli: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contactEstablished"
                      checked={customerContact.contactEstablished}
                      onCheckedChange={(checked) =>
                        setCustomerContact({ ...customerContact, contactEstablished: checked })
                      }
                    />
                    <Label htmlFor="contactEstablished">Contact Established</Label>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Customer Stance per IO</Label>
                    <Textarea
                      placeholder="Customer's statement during IO call..."
                      value={customerContact.customerStanceIO}
                      onChange={(e) =>
                        setCustomerContact({ ...customerContact, customerStanceIO: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Device & Location */}
        <TabsContent value="device-location">
          <Card>
            <CardHeader>
              <CardTitle>Device & Location Analysis</CardTitle>
              <CardDescription>
                Analyze device and location patterns for the disputed transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Device Changed</Label>
                  <Select
                    value={deviceLocation.deviceChanged}
                    onValueChange={(value) =>
                      setDeviceLocation({ ...deviceLocation, deviceChanged: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {yesNoUnknownOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Location Changed</Label>
                  <Select
                    value={deviceLocation.locationChanged}
                    onValueChange={(value) =>
                      setDeviceLocation({ ...deviceLocation, locationChanged: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {yesNoUnknownOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>T-PIN Changed</Label>
                  <Select
                    value={deviceLocation.tpinChanged}
                    onValueChange={(value) =>
                      setDeviceLocation({ ...deviceLocation, tpinChanged: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Password Changed</Label>
                  <Select
                    value={deviceLocation.passwordChanged}
                    onValueChange={(value) =>
                      setDeviceLocation({ ...deviceLocation, passwordChanged: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Biometric Attempts</Label>
                  <Select
                    value={deviceLocation.biometricAttempts}
                    onValueChange={(value) =>
                      setDeviceLocation({ ...deviceLocation, biometricAttempts: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {attemptOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Login Attempts</Label>
                  <Select
                    value={deviceLocation.loginAttempts}
                    onValueChange={(value) =>
                      setDeviceLocation({ ...deviceLocation, loginAttempts: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {attemptOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>New Beneficiary Added</Label>
                  <Select
                    value={deviceLocation.newBeneficiaryAdded}
                    onValueChange={(value) =>
                      setDeviceLocation({ ...deviceLocation, newBeneficiaryAdded: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {yesNoOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Actions Taken */}
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Actions Taken</CardTitle>
              <CardDescription>
                Record preventive and remedial actions taken
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    id="deviceBlocked"
                    checked={actionsTaken.deviceBlocked}
                    onCheckedChange={(checked) =>
                      setActionsTaken({ ...actionsTaken, deviceBlocked: checked })
                    }
                  />
                  <Label htmlFor="deviceBlocked" className="flex-1 cursor-pointer">
                    Device Blocked
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    id="mbBlocked"
                    checked={actionsTaken.mbBlocked}
                    onCheckedChange={(checked) =>
                      setActionsTaken({ ...actionsTaken, mbBlocked: checked })
                    }
                  />
                  <Label htmlFor="mbBlocked" className="flex-1 cursor-pointer">
                    Mobile Banking Blocked
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    id="ibBlocked"
                    checked={actionsTaken.ibBlocked}
                    onCheckedChange={(checked) =>
                      setActionsTaken({ ...actionsTaken, ibBlocked: checked })
                    }
                  />
                  <Label htmlFor="ibBlocked" className="flex-1 cursor-pointer">
                    Internet Banking Blocked
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    id="dcBlocked"
                    checked={actionsTaken.dcBlocked}
                    onCheckedChange={(checked) =>
                      setActionsTaken({ ...actionsTaken, dcBlocked: checked })
                    }
                  />
                  <Label htmlFor="dcBlocked" className="flex-1 cursor-pointer">
                    Debit Card Blocked
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    id="simBlockRequested"
                    checked={actionsTaken.simBlockRequested}
                    onCheckedChange={(checked) =>
                      setActionsTaken({ ...actionsTaken, simBlockRequested: checked })
                    }
                  />
                  <Label htmlFor="simBlockRequested" className="flex-1 cursor-pointer">
                    SIM Block Requested
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    id="ptaReported"
                    checked={actionsTaken.ptaReported}
                    onCheckedChange={(checked) =>
                      setActionsTaken({ ...actionsTaken, ptaReported: checked })
                    }
                  />
                  <Label htmlFor="ptaReported" className="flex-1 cursor-pointer">
                    PTA Reported
                  </Label>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ftdhFiled"
                    checked={actionsTaken.ftdhFiled}
                    onCheckedChange={(checked) =>
                      setActionsTaken({ ...actionsTaken, ftdhFiled: checked })
                    }
                  />
                  <Label htmlFor="ftdhFiled" className="cursor-pointer">
                    FTDH Filed
                  </Label>
                </div>

                {actionsTaken.ftdhFiled && (
                  <div className="space-y-2 pl-6">
                    <Label>FTDH Reference ID</Label>
                    <Input
                      placeholder="FTDH-2025-XXXXX"
                      value={actionsTaken.ftdhId}
                      onChange={(e) =>
                        setActionsTaken({ ...actionsTaken, ftdhId: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Audio Evidence */}
        <TabsContent value="audio">
          <Card>
            <CardHeader>
              <CardTitle>Audio Evidence</CardTitle>
              <CardDescription>
                Upload and transcribe audio recordings related to this case
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload Audio File
              </Button>

              <div className="space-y-4">
                {audioFiles.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileAudio className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{file.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {file.type} &bull; {file.duration} &bull; {file.uploadDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTranscribe(file.id)}
                          disabled={transcribingId === file.id}
                        >
                          {transcribingId === file.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Transcribing...
                            </>
                          ) : (
                            'Transcribe'
                          )}
                        </Button>
                      </div>
                    </div>

                    {file.transcription && (
                      <div className="space-y-2">
                        <Label>Transcription</Label>
                        <Textarea
                          value={file.transcription}
                          onChange={(e) =>
                            setAudioFiles((prev) =>
                              prev.map((f) =>
                                f.id === file.id
                                  ? { ...f, transcription: e.target.value }
                                  : f
                              )
                            )
                          }
                          rows={8}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Observations */}
        <TabsContent value="observations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Observations</CardTitle>
                  <CardDescription>
                    System-generated observations based on investigation findings
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={generateObservations}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {observations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                  <p>No observations generated yet.</p>
                  <p className="text-sm">Complete the investigation tabs and click Regenerate.</p>
                </div>
              ) : (
                observations.map((obs, index) => (
                  <Alert
                    key={index}
                    variant={obs.type === 'critical' ? 'destructive' : 'default'}
                    className={
                      obs.type === 'warning'
                        ? 'border-yellow-500 bg-yellow-50'
                        : obs.type === 'info'
                        ? 'border-blue-500 bg-blue-50'
                        : ''
                    }
                  >
                    {obs.type === 'critical' ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{obs.text}</AlertDescription>
                  </Alert>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Conclusion */}
        <TabsContent value="conclusion">
          <Card>
            <CardHeader>
              <CardTitle>Conclusion</CardTitle>
              <CardDescription>
                Finalize investigation findings and recommendation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fraud Type Confirmed</Label>
                  <Select
                    value={conclusion.fraudTypeConfirmed}
                    onValueChange={(value) =>
                      setConclusion({ ...conclusion, fraudTypeConfirmed: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fraud type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fraudTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Root Cause</Label>
                  <Select
                    value={conclusion.rootCause}
                    onValueChange={(value) =>
                      setConclusion({ ...conclusion, rootCause: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select root cause" />
                    </SelectTrigger>
                    <SelectContent>
                      {rootCauses.map((cause) => (
                        <SelectItem key={cause.value} value={cause.value}>
                          {cause.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Liability</Label>
                  <Select
                    value={conclusion.liability}
                    onValueChange={(value) =>
                      setConclusion({ ...conclusion, liability: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select liability" />
                    </SelectTrigger>
                    <SelectContent>
                      {liabilityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Recommendation</Label>
                  <Select
                    value={conclusion.recommendation}
                    onValueChange={(value) =>
                      setConclusion({ ...conclusion, recommendation: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recommendation" />
                    </SelectTrigger>
                    <SelectContent>
                      {recommendationOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Conclusion Notes</Label>
                <Textarea
                  placeholder="Detailed conclusion and justification..."
                  rows={6}
                  value={conclusion.conclusionNotes}
                  onChange={(e) =>
                    setConclusion({ ...conclusion, conclusionNotes: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit for Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this investigation for supervisor review?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Before submitting</AlertTitle>
              <AlertDescription>
                Please ensure all required fields are completed and observations have been
                generated.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitForReview} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit for Review'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InvestigationPage;
