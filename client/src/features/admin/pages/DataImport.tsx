import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/shared/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Upload, FileText, Users, Briefcase, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { format } from "date-fns";
import type { DataImport, ImportRecord } from "@shared/schema";

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
}

function FileUploadArea({ onFileSelect, isUploading }: FileUploadAreaProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'}`}
      data-testid="file-upload-area"
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {isDragActive ? 'Drop the file here' : 'Upload CSV or Excel file'}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Drag and drop your file here, or click to browse
      </p>
      <p className="text-xs text-gray-400">
        Supported formats: CSV, XLS, XLSX (Max 10MB)
      </p>
    </div>
  );
}

interface ImportListProps {
  imports: DataImport[];
  onImportSelect: (importData: DataImport) => void;
}

function ImportList({ imports, onImportSelect }: ImportListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'candidates':
        return <Users className="h-4 w-4" />;
      case 'jobs':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {imports.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p>No imports found. Upload your first file to get started.</p>
        </div>
      ) : (
        imports.map((importData) => (
          <Card 
            key={importData.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onImportSelect(importData)}
            data-testid={`import-item-${importData.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(importData.importType)}
                  <div>
                    <h3 className="font-medium text-gray-900">{importData.fileName}</h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(importData.createdAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right text-sm">
                    <div className="text-gray-900">
                      {importData.successfulRecords || 0} / {importData.totalRecords || 0} records
                    </div>
                    {(importData.failedRecords || 0) > 0 && (
                      <div className="text-red-600">
                        {importData.failedRecords || 0} failed
                      </div>
                    )}
                  </div>
                  <Badge className={getStatusColor(importData.status)} variant="secondary">
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(importData.status)}
                      <span className="capitalize">{importData.status}</span>
                    </span>
                  </Badge>
                </div>
              </div>
              
              {importData.status === 'processing' && (importData.totalRecords || 0) > 0 && (
                <div className="mt-3">
                  <Progress 
                    value={((importData.successfulRecords || 0) / (importData.totalRecords || 1)) * 100} 
                    className="h-2" 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

interface ImportDetailsProps {
  importData: DataImport;
  onBack: () => void;
}

function ImportDetails({ importData, onBack }: ImportDetailsProps) {
  const { data: records, isLoading } = useQuery<ImportRecord[]>({
    queryKey: ['/api/imports', importData.id, 'records'],
    enabled: !!importData.id
  });

  const failedRecords = (records || []).filter((record: ImportRecord) => record.status === 'failed');
  const successfulRecords = (records || []).filter((record: ImportRecord) => record.status === 'success');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} data-testid="button-back">
          ← Back to Imports
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{importData.fileName}</span>
          </CardTitle>
          <CardDescription>
            Import details and processing results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{importData.totalRecords || 0}</div>
              <div className="text-sm text-gray-500">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{importData.successfulRecords || 0}</div>
              <div className="text-sm text-gray-500">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{importData.failedRecords || 0}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {format(new Date(importData.createdAt), 'MMM d')}
              </div>
              <div className="text-sm text-gray-500">Import Date</div>
            </div>
          </div>

          {importData.errorSummary && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Import Errors</AlertTitle>
              <AlertDescription>{importData.errorSummary}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {failedRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Failed Records ({failedRecords.length})</CardTitle>
            <CardDescription>
              Records that could not be imported due to validation errors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {failedRecords.slice(0, 10).map((record: ImportRecord) => (
                <div key={record.id} className="border rounded p-3 bg-red-50">
                  <div className="font-medium text-sm">Row {record.rowNumber}</div>
                  <div className="text-sm text-red-600">{record.errorMessage}</div>
                  {record.originalData && (
                    <div className="text-xs text-gray-600 mt-1 font-mono">
                      {JSON.stringify(record.originalData, null, 2).substring(0, 200)}...
                    </div>
                  )}
                </div>
              ))}
              {failedRecords.length > 10 && (
                <div className="text-sm text-gray-500 text-center py-2">
                  And {failedRecords.length - 10} more failed records...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DataImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedImport, setSelectedImport] = useState<DataImport | null>(null);
  const [activeTab, setActiveTab] = useState("upload");

  // Query to fetch imports
  const { data: imports = [], isLoading: isLoadingImports } = useQuery<DataImport[]>({
    queryKey: ['/api/imports'],
    enabled: !!user
  });

  // Mutation to create new import
  const createImportMutation = useMutation({
    mutationFn: async (data: {
      file: File;
      importType: string;
    }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('importType', data.importType);
      
      // Get organization ID for header
      const currentOrgId = sessionStorage.getItem('currentOrgId') || 
        (window.location.hostname.includes('localhost') || window.location.hostname.includes('replit') ? 
          '90531171-d56b-4732-baba-35be47b0cb08' : null);
      
      const headers: Record<string, string> = {};
      if (currentOrgId) {
        headers['x-org-id'] = currentOrgId;
      }
      
      // Use fetch directly for FormData uploads (FormData can't use apiRequest which expects JSON)
      const response = await fetch('/api/imports', {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
      toast({
        title: "Import Created",
        description: "Your file has been uploaded and import process started.",
      });
      setActiveTab("history");
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to create import",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = async (file: File) => {
    try {
      // Basic validation
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      const allowedExtensions = ['.csv', '.xls', '.xlsx'];
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV, XLS, or XLSX file.",
          variant: "destructive",
        });
        return;
      }

      // Determine import type based on file content
      const importType = file.name.toLowerCase().includes('candidate') ? 'candidates' : 'jobs';

      createImportMutation.mutate({
        file,
        importType
      });
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to process the uploaded file.",
        variant: "destructive",
      });
    }
  };

  // Check if user has admin role (this will be enforced by the API, but we show a message for UX)
  // Note: The actual role check is done on the backend, this is just for user experience
  const isLoading = isLoadingImports;
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (selectedImport) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ImportDetails 
          importData={selectedImport} 
          onBack={() => setSelectedImport(null)} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Import</h1>
        <p className="text-gray-600">
          Import candidates and job data from CSV or Excel files
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" data-testid="tab-upload">Upload File</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Import History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Data File</CardTitle>
              <CardDescription>
                Select a CSV or Excel file containing candidate or job data to import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadArea 
                onFileSelect={handleFileSelect}
                isUploading={createImportMutation.isPending}
              />
              
              <Alert className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important Notes</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Ensure your CSV/Excel file has headers in the first row</li>
                    <li>Data will be validated before import - invalid records will be flagged</li>
                    <li>You can review and correct failed imports before retrying</li>
                    <li>Import process may take several minutes for large files</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                View and manage your previous data imports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingImports ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <ImportList 
                  imports={imports}
                  onImportSelect={setSelectedImport}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}