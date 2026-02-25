import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { getAllCases, addImportedCases } from '@/data/caseStorage';
import { parseCaseImportCsv, buildCasesFromImportRows } from '@/utils/caseImport';

const importTypes = [
  {
    value: 'cases',
    label: 'Cases',
    description: 'Import new fraud cases with customer information',
    template: 'sample_ibmb_case_import.csv',
  },
  {
    value: 'transactions',
    label: 'Transactions',
    description: 'Import transactions for existing cases',
    template: 'transactions_import_template.csv',
  },
];

export function CaseImportPage() {
  const [importType, setImportType] = useState('cases');
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
      setUploadResult(null);
    }
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);

    try {
      if (importType !== 'cases') {
        setUploadResult({
          total: 0,
          success: 0,
          failed: 0,
          skipped: 0,
          errors: [
            {
              row: 1,
              field: 'Import Type',
              message: 'Only Cases import is enabled in demo mode.',
            },
          ],
        });
        return;
      }

      const content = await file.text();
      const { rows, errors, totalRows } = parseCaseImportCsv(content);

      const existingCases = getAllCases();
      const { importedCases, skipped } = buildCasesFromImportRows(rows, existingCases);
      const { addedCases } = addImportedCases(importedCases);

      setUploadResult({
        total: totalRows,
        success: rows.length - skipped,
        failed: errors.length,
        skipped,
        addedCases,
        createdCases: importedCases.length,
        errors,
      });
    } catch {
      setUploadResult({
        total: 0,
        success: 0,
        failed: 1,
        skipped: 0,
        errors: [
          {
            row: 1,
            field: 'file',
            message: 'Unable to parse file. Please verify CSV format and try again.',
          },
        ],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploadResult(null);
  };

  const selectedType = importTypes.find((t) => t.value === importType);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/cases">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Import Data</h2>
          <p className="text-muted-foreground">
            Upload CSV files to bulk import cases or transactions
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Import Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Import Type</CardTitle>
              <CardDescription>
                Select what type of data you want to import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={importType} onValueChange={setImportType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {importTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedType?.description}
              </p>
            </CardContent>
          </Card>

          {/* File Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Drag and drop a CSV file or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!uploadResult ? (
                <>
                  <div
                    className={cn(
                      'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                      isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-primary/50',
                      file && 'border-green-500 bg-green-50'
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {file ? (
                      <div className="space-y-2">
                        <FileSpreadsheet className="h-12 w-12 mx-auto text-green-600" />
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="space-y-2 block cursor-pointer">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-lg font-medium">
                          Drop your CSV file here
                        </p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse
                        </p>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileSelect}
                          className="sr-only"
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={!file}
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={!file || isUploading}
                    >
                      {isUploading ? (
                        <>
                          <span className="animate-spin mr-2">
                            <Upload className="h-4 w-4" />
                          </span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload & Process
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Results Summary */}
                  <Alert
                    variant={uploadResult.failed > 0 ? 'destructive' : 'default'}
                    className={
                      uploadResult.failed === 0
                        ? 'border-green-500 bg-green-50'
                        : ''
                    }
                  >
                    {uploadResult.failed === 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {uploadResult.failed === 0
                        ? 'Import Successful'
                        : 'Import Completed with Errors'}
                    </AlertTitle>
                    <AlertDescription>
                      Processed {uploadResult.total} rows • Imported {uploadResult.addedCases ?? uploadResult.success} rows into {uploadResult.createdCases ?? 0} case(s)
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                        <div className="text-2xl font-bold text-green-600">
                          {uploadResult.success}
                        </div>
                        <p className="text-sm text-muted-foreground">Successful</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <XCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                        <div className="text-2xl font-bold text-red-600">
                          {uploadResult.failed}
                        </div>
                        <p className="text-sm text-muted-foreground">Failed</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <AlertCircle className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                        <div className="text-2xl font-bold text-yellow-600">
                          {uploadResult.skipped}
                        </div>
                        <p className="text-sm text-muted-foreground">Skipped</p>
                      </CardContent>
                    </Card>
                  </div>

                  {uploadResult.errors.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Errors</h4>
                      <div className="space-y-2 text-sm">
                        {uploadResult.errors.map((error, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 text-red-600"
                          >
                            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>
                              Row {error.row}: {error.field} - {error.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleReset}>
                      Import Another File
                    </Button>
                    <Button asChild>
                      <Link to="/cases">View Cases</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Download Template</CardTitle>
              <CardDescription>
                Use our template to ensure correct formatting
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importType === 'cases' ? (
                <Button variant="outline" className="w-full" asChild>
                  <a href="/sample_ibmb_case_import.csv" download>
                    <Download className="mr-2 h-4 w-4" />
                    {selectedType?.template}
                  </a>
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  {selectedType?.template}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>File must be in CSV format</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>First row should contain headers</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>CNIC must be 13 digits</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Dates in YYYY-MM-DD format</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Amounts without commas or currency symbols</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Rows with same CNIC/date/channel are grouped into one case with multiple transactions</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CaseImportPage;
