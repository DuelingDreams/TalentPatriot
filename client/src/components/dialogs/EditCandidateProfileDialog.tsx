import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/shared/hooks/use-toast'
import { useUpdateCandidate } from '@/features/candidates/hooks/useCandidates'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, Edit } from 'lucide-react'
import type { Candidate } from '@shared/schema'

const editCandidateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  currentTitle: z.string().optional(),
  desiredSalaryMin: z.coerce.number().min(0).optional().nullable(),
  desiredSalaryMax: z.coerce.number().min(0).optional().nullable(),
  availability: z.string().optional(),
  totalYearsExperience: z.coerce.number().min(0).optional().nullable(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  summary: z.string().optional(),
})

type EditCandidateFormData = z.infer<typeof editCandidateSchema>

interface EditCandidateProfileDialogProps {
  candidate: Candidate
  children?: React.ReactNode
  onSuccess?: () => void
}

export function EditCandidateProfileDialog({ candidate, children, onSuccess }: EditCandidateProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const { currentOrgId } = useAuth()
  const updateCandidate = useUpdateCandidate()

  const form = useForm<EditCandidateFormData>({
    resolver: zodResolver(editCandidateSchema),
    defaultValues: {
      name: candidate?.name || '',
      email: candidate?.email || '',
      phone: candidate?.phone || '',
      currentTitle: candidate?.currentTitle || '',
      desiredSalaryMin: candidate?.desiredSalaryMin || null,
      desiredSalaryMax: candidate?.desiredSalaryMax || null,
      availability: candidate?.availability || '',
      totalYearsExperience: candidate?.totalYearsExperience || null,
      linkedinUrl: candidate?.linkedinUrl || '',
      summary: candidate?.summary || '',
    },
  })

  useEffect(() => {
    if (candidate && open) {
      form.reset({
        name: candidate?.name || '',
        email: candidate?.email || '',
        phone: candidate?.phone || '',
        currentTitle: candidate?.currentTitle || '',
        desiredSalaryMin: candidate?.desiredSalaryMin || null,
        desiredSalaryMax: candidate?.desiredSalaryMax || null,
        availability: candidate?.availability || '',
        totalYearsExperience: candidate?.totalYearsExperience || null,
        linkedinUrl: candidate?.linkedinUrl || '',
        summary: candidate?.summary || '',
      })
    }
  }, [candidate, open, form])

  const onSubmit = async (data: EditCandidateFormData) => {
    if (!currentOrgId || !candidate?.id) {
      toast({
        title: 'Error',
        description: 'Unable to update candidate',
        variant: 'destructive',
      })
      return
    }

    try {
      await updateCandidate.mutateAsync({
        id: candidate.id,
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          currentTitle: data.currentTitle || undefined,
          desiredSalaryMin: data.desiredSalaryMin || undefined,
          desiredSalaryMax: data.desiredSalaryMax || undefined,
          availability: data.availability || undefined,
          totalYearsExperience: data.totalYearsExperience || undefined,
          linkedinUrl: data.linkedinUrl || undefined,
          summary: data.summary || undefined,
        },
      })

      toast({
        title: 'Success',
        description: 'Candidate profile updated successfully',
      })

      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Update candidate error:', error)
      toast({
        title: 'Error',
        description: 'Failed to update candidate profile',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" data-testid="edit-profile-button">
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Candidate Profile</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Full name" data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@example.com" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(555) 123-4567" data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Software Engineer" data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="desiredSalaryMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Salary (Min)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        placeholder="50000"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        data-testid="input-salary-min" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="desiredSalaryMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Salary (Max)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        placeholder="80000"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        data-testid="input-salary-max" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger data-testid="select-availability">
                          <SelectValue placeholder="Select availability" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="2_weeks">2 Weeks</SelectItem>
                        <SelectItem value="1_month">1 Month</SelectItem>
                        <SelectItem value="2_months">2 Months</SelectItem>
                        <SelectItem value="3_months">3+ Months</SelectItem>
                        <SelectItem value="not_looking">Not Looking</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalYearsExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        placeholder="5"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        data-testid="input-experience" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="linkedinUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://linkedin.com/in/..." data-testid="input-linkedin" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Summary</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Brief summary of professional background..."
                      rows={3}
                      data-testid="input-summary" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={updateCandidate.isPending} data-testid="button-save">
                {updateCandidate.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
