import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

import { Badge } from '@/components/ui/badge'
import { Download, Upload, Database, FileSpreadsheet, FileText, Archive } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

interface ExportOptions {
  candidates: boolean
  jobs: boolean
  applications: boolean
  interviews: boolean
  notes: boolean
}

interface ImportProgress {
  total: number
  processed: number
  errors: string[]
  status: 'idle' | 'processing' | 'completed' | 'error'
}

export function DataExport() {
  const { user } = useAuth()
  const currentOrganization = { id: user?.user_metadata?.currentOrgId || 'demo-org' }
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('excel')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    candidates: true,
    jobs: true,
    applications: true,
    interviews: false,
    notes: false
  })
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    errors: [],
    status: 'idle'
  })

  const handleExport = async () => {
    if (!currentOrganization?.id) return

    setIsExporting(true)
    try {
      const selectedTables = Object.entries(exportOptions)
        .filter(([_, selected]) => selected)
        .map(([table, _]) => table)

      if (selectedTables.length === 0) {
        toast({
          title: "No Data Selected",
          description: "Please select at least one data type to export.",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/data/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: currentOrganization.id,
          format: exportFormat,
          tables: selectedTables
        })
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `talentpatriot-export-${new Date().toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'xlsx' : 'zip'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export Complete",
        description: `Your data has been exported successfully as ${exportFormat.toUpperCase()}.`
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentOrganization?.id) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('orgId', currentOrganization.id)

    setIsImporting(true)
    setImportProgress({ total: 0, processed: 0, errors: [], status: 'processing' })

    try {
      const response = await fetch('/api/data/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Import failed')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim()) {
            try {
              const progress = JSON.parse(line)
              setImportProgress(progress)
            } catch (e) {
              // Ignore non-JSON lines
            }
          }
        }
      }

      setImportProgress(prev => ({ ...prev, status: 'completed' }))
      toast({
        title: "Import Complete",
        description: "Your data has been imported successfully."
      })
    } catch (error) {
      setImportProgress(prev => ({ ...prev, status: 'error' }))
      toast({
        title: "Import Failed",
        description: "Failed to import data. Please check the file format.",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleBackup = async () => {
    if (!currentOrganization?.id) return

    try {
      const response = await fetch('/api/data/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: currentOrganization.id })
      })

      if (!response.ok) throw new Error('Backup failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `talentpatriot-backup-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Backup Complete",
        description: "Your complete database backup has been downloaded."
      })
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download your recruitment data in CSV or Excel format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block">Export Format</label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'excel') => setExportFormat(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel (.xlsx)
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV Files (.zip)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Data to Export</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(exportOptions).map(([key, checked]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={checked}
                    onCheckedChange={(checked) =>
                      setExportOptions(prev => ({ ...prev, [key]: !!checked }))
                    }
                  />
                  <label htmlFor={key} className="text-sm capitalize cursor-pointer">
                    {key}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </CardContent>
      </Card>

      {/* Import Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Upload candidate data from CSV or Excel files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              id="import-file"
              accept=".csv,.xlsx,.xls"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
            />
            <Button 
              onClick={() => document.getElementById('import-file')?.click()}
              disabled={isImporting}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing...' : 'Choose File to Import'}
            </Button>
          </div>

          {importProgress.status === 'processing' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{importProgress.processed} / {importProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(importProgress.processed / importProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {importProgress.status === 'completed' && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-green-800 dark:text-green-200 text-sm">
                Import completed successfully! Processed {importProgress.processed} records.
              </p>
            </div>
          )}

          {importProgress.errors.length > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium mb-2">
                Warnings ({importProgress.errors.length}):
              </p>
              <ul className="text-yellow-700 dark:text-yellow-300 text-xs space-y-1">
                {importProgress.errors.slice(0, 5).map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
                {importProgress.errors.length > 5 && (
                  <li>• ... and {importProgress.errors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-1">Supported formats:</p>
            <ul className="space-y-1">
              <li>• CSV files with headers matching our candidate fields</li>
              <li>• Excel files (.xlsx, .xls) with data in the first sheet</li>
              <li>• Required fields: name, email (phone and other fields optional)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Backup & Restore
          </CardTitle>
          <CardDescription>
            Create complete backups of your organization data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleBackup} variant="outline" className="flex-1 sm:flex-initial">
              <Database className="h-4 w-4 mr-2" />
              Create Full Backup
            </Button>
            
            <div className="flex-1 sm:flex-initial">
              <input
                type="file"
                id="restore-file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    toast({
                      title: "Restore Feature",
                      description: "Restore functionality coming soon. Please contact support for assistance.",
                    })
                  }
                }}
              />
              <Button 
                onClick={() => document.getElementById('restore-file')?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Restore from Backup
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-1">Backup includes:</p>
            <ul className="space-y-1">
              <li>• All candidate profiles and resumes</li>
              <li>• Job postings and pipeline configurations</li>
              <li>• Application history and interview notes</li>
              <li>• Team member data and permissions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}