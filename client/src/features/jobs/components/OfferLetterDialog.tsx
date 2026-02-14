import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { AppModal } from '@/components/ui/AppModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/shared/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { Loader2, FileText, Eye, Edit3, Printer, Copy, Send, Download } from 'lucide-react'
import type { OfferLetter } from '@shared/schema'

const offerLetterSchema = z.object({
  candidateId: z.string().min(1),
  jobId: z.string().min(1),
  clientId: z.string().optional().nullable(),
  organizationId: z.string().min(1),
  salaryAmount: z.string().min(1, 'Salary amount is required'),
  salaryType: z.enum(['per year', 'per hour', 'fixed']).default('per year'),
  billRate: z.string().optional(),
  feeType: z.enum(['percentage', 'flat']).optional().nullable(),
  feeAmount: z.string().optional(),
  employmentType: z.enum(['Full-Time', 'Part-Time', 'Contract']).default('Full-Time'),
  startDate: z.string().optional(),
  officeLocation: z.string().optional(),
  managerName: z.string().optional(),
  benefits: z.string().optional(),
  signatoryName: z.string().optional(),
  signatoryTitle: z.string().optional(),
  acceptBy: z.string().optional(),
  customNotes: z.string().optional(),
})

type OfferLetterFormData = z.infer<typeof offerLetterSchema>

interface OfferLetterDialogProps {
  candidateId: string
  candidateName: string
  jobId: string
  jobTitle: string
  clientId?: string | null
  clientName?: string | null
  existingOfferId?: string
  trigger?: React.ReactNode
  onCreated?: () => void
}

export function OfferLetterDialog({
  candidateId,
  candidateName,
  jobId,
  jobTitle,
  clientId,
  clientName,
  existingOfferId,
  trigger,
  onCreated,
}: OfferLetterDialogProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const { toast } = useToast()
  const { currentOrgId } = useAuth()

  const { data: orgData } = useQuery({
    queryKey: ['/api/organizations', currentOrgId],
    enabled: !!currentOrgId && open,
  })

  const { data: existingOffer } = useQuery<OfferLetter>({
    queryKey: ['/api/offer-letters', existingOfferId],
    enabled: !!existingOfferId && open,
  })

  const org = useMemo(() => {
    if (!orgData) return null
    if (Array.isArray(orgData)) return orgData[0]
    return orgData
  }, [orgData])

  const form = useForm<OfferLetterFormData>({
    resolver: zodResolver(offerLetterSchema),
    defaultValues: {
      candidateId,
      jobId,
      clientId: clientId || undefined,
      organizationId: currentOrgId || '',
      salaryAmount: '',
      salaryType: 'per year',
      billRate: '',
      feeType: null,
      feeAmount: '',
      employmentType: 'Full-Time',
      startDate: '',
      officeLocation: '',
      managerName: '',
      benefits: '',
      signatoryName: '',
      signatoryTitle: '',
      acceptBy: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      customNotes: '',
    },
  })

  useEffect(() => {
    if (existingOffer) {
      form.reset({
        candidateId: existingOffer.candidateId,
        jobId: existingOffer.jobId,
        clientId: existingOffer.clientId || undefined,
        organizationId: existingOffer.organizationId,
        salaryAmount: existingOffer.salaryAmount?.toString() || '',
        salaryType: (existingOffer.salaryType as any) || 'per year',
        billRate: existingOffer.billRate?.toString() || '',
        feeType: (existingOffer.feeType as any) || null,
        feeAmount: existingOffer.feeAmount?.toString() || '',
        employmentType: (existingOffer.employmentType as any) || 'Full-Time',
        startDate: existingOffer.startDate || '',
        officeLocation: existingOffer.officeLocation || '',
        managerName: existingOffer.managerName || '',
        benefits: existingOffer.benefits?.join('\n') || '',
        signatoryName: existingOffer.signatoryName || '',
        signatoryTitle: existingOffer.signatoryTitle || '',
        acceptBy: existingOffer.acceptBy || '',
        customNotes: existingOffer.customNotes || '',
      })
    }
  }, [existingOffer, form])

  useEffect(() => {
    if (currentOrgId) {
      form.setValue('organizationId', currentOrgId)
    }
  }, [currentOrgId, form])

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest<OfferLetter>('/api/offer-letters', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      })
    },
    onSuccess: () => {
      toast({ title: 'Offer letter created', description: 'The offer letter has been saved as a draft.' })
      queryClient.invalidateQueries({ queryKey: ['/api/offer-letters'] })
      onCreated?.()
      setOpen(false)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest<OfferLetter>(`/api/offer-letters/${existingOfferId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      })
    },
    onSuccess: () => {
      toast({ title: 'Offer letter updated' })
      queryClient.invalidateQueries({ queryKey: ['/api/offer-letters'] })
      onCreated?.()
      setOpen(false)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const onSubmit = (data: OfferLetterFormData) => {
    const payload = {
      ...data,
      benefits: data.benefits ? data.benefits.split('\n').filter(Boolean) : [],
      clientId: data.clientId || null,
      feeType: data.feeType || null,
    }
    if (existingOfferId) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const watchedValues = form.watch()

  const formattedSalary = useMemo(() => {
    const amount = parseFloat(watchedValues.salaryAmount || '0')
    if (isNaN(amount)) return '$0'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
  }, [watchedValues.salaryAmount])

  const todayDisplay = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const candidateFirstName = candidateName.split(' ')[0]

  const copyHtml = async () => {
    const html = generateLetterHtml()
    try {
      await navigator.clipboard.writeText(html)
      toast({ title: 'Copied', description: 'Offer letter HTML copied to clipboard.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to copy to clipboard.', variant: 'destructive' })
    }
  }

  const generateLetterHtml = () => {
    const benefitsList = (watchedValues.benefits || '').split('\n').filter(Boolean)
    return `<!doctype html><meta charset="utf-8"/><div style="font-family:Inter,system-ui,Arial,sans-serif;max-width:720px;margin:0 auto;padding:24px;">` +
      `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">` +
      `<div style="font-size:18px;font-weight:bold;color:#1E3A5F;">${org?.name || 'Organization'}</div></div>` +
      `<hr style="border:1px solid #e2e8f0;margin:16px 0;"/>` +
      `<p style="color:#334155;font-size:14px;">${todayDisplay}</p>` +
      `<p style="color:#334155;font-size:14px;">${candidateName}</p>` +
      `<p style="color:#334155;font-size:14px;">Dear ${candidateFirstName},</p>` +
      `<p style="color:#334155;font-size:14px;">We are pleased to offer you the position of <b>${jobTitle}</b> with <b>${org?.name || 'our organization'}</b>${watchedValues.managerName ? `, reporting to ${watchedValues.managerName}` : ''} at our ${watchedValues.officeLocation || 'office'}.</p>` +
      `<p style="color:#334155;font-size:14px;">This position is ${watchedValues.employmentType} with a start date of ${watchedValues.startDate || 'TBD'}. Your compensation will be <b>${formattedSalary} ${watchedValues.salaryType}</b>, payable in accordance with our standard payroll practices.</p>` +
      (benefitsList.length > 0 ? `<p style="color:#334155;font-size:14px;font-weight:bold;">Benefits:</p><ul>${benefitsList.map(b => `<li>${b}</li>`).join('')}</ul>` : '') +
      `<p style="color:#334155;font-size:14px;">This offer is contingent upon successful completion of applicable background checks and I-9 verification. Please indicate your acceptance by ${watchedValues.acceptBy || 'the specified date'}.</p>` +
      `<p style="color:#334155;font-size:14px;">Sincerely,<br/><br/>${watchedValues.signatoryName || ''}<br/>${watchedValues.signatoryTitle || ''}<br/><b>${org?.name || ''}</b></p>` +
      `</div>`
  }

  const printLetter = () => window.print()

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</span>
      ) : (
        <Button onClick={() => setOpen(true)} size="sm" variant="outline">
          <FileText size={16} className="mr-1" />
          {existingOfferId ? 'View Offer Letter' : 'Create Offer Letter'}
        </Button>
      )}

      <AppModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={existingOfferId ? 'Edit Offer Letter' : 'Create Offer Letter'}
        subtitle={`${candidateName} — ${jobTitle}${clientName ? ` (${clientName})` : ''}`}
        maxWidth="max-w-6xl"
      >
        <div className="flex gap-2 mb-4 border-b">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'edit'
                ? 'border-[#0EA5E9] text-[#0EA5E9]'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Edit3 size={14} className="inline mr-1" />
            Edit
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-[#0EA5E9] text-[#0EA5E9]'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Eye size={14} className="inline mr-1" />
            Preview
          </button>
        </div>

        {activeTab === 'edit' ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Compensation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="salaryAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary Amount ($)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 120000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salaryType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pay Frequency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[200]">
                            <SelectItem value="per year">Per Year</SelectItem>
                            <SelectItem value="per hour">Per Hour</SelectItem>
                            <SelectItem value="fixed">Fixed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[200]">
                            <SelectItem value="Full-Time">Full-Time</SelectItem>
                            <SelectItem value="Part-Time">Part-Time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Fee Structure (Internal)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="billRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bill Rate ($)</FormLabel>
                        <FormControl>
                          <Input placeholder="Client bill rate" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="feeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fee Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fee type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[200]">
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="flat">Flat Fee</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="feeAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{form.watch('feeType') === 'percentage' ? 'Fee (%)' : 'Fee Amount ($)'}</FormLabel>
                        <FormControl>
                          <Input placeholder={form.watch('feeType') === 'percentage' ? 'e.g. 20' : 'e.g. 15000'} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Job Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="officeLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Office Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Austin, TX or Remote" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="managerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hiring Manager</FormLabel>
                        <FormControl>
                          <Input placeholder="Manager name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefits (one per line)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={"Health Insurance\n401(k)\nPaid Time Off"}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Signatory & Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="signatoryName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signatory Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of person signing" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="signatoryTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signatory Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Head of People" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="acceptBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accept By Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="customNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional terms or notes..." rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="outline" onClick={() => setActiveTab('preview')}>
                  <Eye size={16} className="mr-1" />
                  Preview
                </Button>
                <Button type="submit" disabled={isPending} className="bg-[#0EA5E9] hover:bg-[#0284C7]">
                  {isPending && <Loader2 size={16} className="mr-1 animate-spin" />}
                  {existingOfferId ? 'Update' : 'Save Draft'}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <Card className="p-6 bg-white shadow-sm print:shadow-none">
              <div className="max-w-[720px] mx-auto">
                <div className="flex items-start justify-between">
                  <div className="text-xl font-semibold text-[#1E3A5F]">{org?.name || 'Organization'}</div>
                </div>

                <Separator className="my-4" />

                <div className="text-sm text-neutral-600">{todayDisplay}</div>
                <div className="mt-2 text-sm text-neutral-700">
                  <div>{candidateName}</div>
                </div>

                <div className="mt-6 text-neutral-800 leading-7">
                  <p>Dear {candidateFirstName},</p>
                  <p className="mt-4">
                    We are pleased to offer you the position of <b>{jobTitle}</b> with <b>{org?.name || 'our organization'}</b>
                    {watchedValues.managerName ? `, reporting to ${watchedValues.managerName}` : ''} at our {watchedValues.officeLocation || 'office'}.
                  </p>
                  <p className="mt-4">
                    This position is {watchedValues.employmentType} with a start date of {watchedValues.startDate || 'TBD'}. Your
                    compensation will be <b>{formattedSalary} {watchedValues.salaryType}</b>, payable in
                    accordance with our standard payroll practices.
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-3 rounded-2xl border overflow-hidden">
                  <div className="bg-[#1E3A5F] text-white p-3 text-center text-sm font-semibold">Compensation</div>
                  <div className="bg-[#1E3A5F] text-white p-3 text-center text-sm font-semibold">Start Date</div>
                  <div className="bg-[#1E3A5F] text-white p-3 text-center text-sm font-semibold">Status</div>
                  <div className="col-span-1 p-3 text-center text-neutral-700">{formattedSalary} {watchedValues.salaryType}</div>
                  <div className="col-span-1 p-3 text-center text-neutral-700">{watchedValues.startDate || 'TBD'}</div>
                  <div className="col-span-1 p-3 text-center text-neutral-700">{watchedValues.employmentType}</div>
                </div>

                {watchedValues.benefits && watchedValues.benefits.trim() && (
                  <div className="mt-6">
                    <div className="text-sm font-semibold text-neutral-700">Benefits</div>
                    <ul className="mt-2 list-disc list-inside text-neutral-700 space-y-1">
                      {watchedValues.benefits.split('\n').filter(Boolean).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6 text-neutral-800 leading-7">
                  {watchedValues.customNotes && (
                    <p>{watchedValues.customNotes}</p>
                  )}
                  <p className="mt-4">
                    This offer is contingent upon successful completion of applicable background checks and I-9 verification.
                    Please indicate your acceptance by {watchedValues.acceptBy || 'the specified date'} by signing below or via our e-signature system.
                  </p>
                  <p className="mt-4">We are excited to welcome you to <b>{org?.name || 'our organization'}</b> and look forward to your contributions.</p>
                </div>

                <div className="mt-8">
                  <div className="text-neutral-800">Sincerely,</div>
                  <div className="mt-6">
                    <div className="font-medium text-neutral-900">{watchedValues.signatoryName || '[Signatory Name]'}</div>
                    <div className="text-neutral-600">{watchedValues.signatoryTitle || '[Title]'}</div>
                    <div className="font-semibold text-neutral-900">{org?.name || 'Organization'}</div>
                  </div>

                  <div className="mt-10 pt-6 border-t text-neutral-700">
                    <div className="text-sm">Accepted by:</div>
                    <div className="mt-6 h-8 border-b w-72" />
                    <div className="mt-4 text-sm">Date:</div>
                    <div className="mt-2 h-8 border-b w-40" />
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-between pt-2">
              <div className="flex gap-2">
                <Button onClick={printLetter} variant="outline" size="sm">
                  <Printer size={14} className="mr-1" />
                  Print
                </Button>
                <Button onClick={copyHtml} variant="outline" size="sm">
                  <Copy size={14} className="mr-1" />
                  Copy HTML
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveTab('edit')}>
                  <Edit3 size={14} className="mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  className="bg-[#0EA5E9] hover:bg-[#0284C7]"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isPending}
                >
                  {isPending && <Loader2 size={14} className="mr-1 animate-spin" />}
                  {existingOfferId ? 'Update' : 'Save Draft'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </AppModal>
    </>
  )
}
