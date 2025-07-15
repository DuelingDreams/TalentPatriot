import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Client {
  id: string
  name: string
  industry?: string | null
  location?: string | null
  website?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    jobs: number
  }
}

interface CreateClientData {
  name: string
  industry?: string
  location?: string
  website?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  notes?: string
}

interface UpdateClientData extends CreateClientData {
  id: string
}

// Hook to fetch all clients - replaced with the new secured version from useJobs.ts
export function useClients() {
  const { userRole } = useAuth()
  const isDemoMode = localStorage.getItem('demo_mode') === 'true'
  
  return useQuery({
    queryKey: ['clients', userRole, isDemoMode],
    queryFn: async () => {
      // Always return demo data if in demo mode
      if (isDemoMode || userRole === 'demo_viewer') {
        const { demoClients, demoJobs } = await import('@/lib/demo-data')
        return demoClients.map(client => ({
          ...client,
          _count: {
            jobs: demoJobs.filter(job => job.clientId === client.id).length
          }
        }))
      }

      let clientsQuery = supabase
        .from('clients')
        .select('*')
      
      let jobsQuery = supabase
        .from('jobs')
        .select('client_id')
      
      // Filter for real users - exclude demo data
      clientsQuery = clientsQuery.neq('status', 'demo').or('status.is.null')
      jobsQuery = jobsQuery.neq('recordStatus', 'demo').or('recordStatus.is.null')
      
      clientsQuery = clientsQuery.order('name', { ascending: true })
      
      const [clientsResponse, jobsResponse] = await Promise.all([
        clientsQuery,
        jobsQuery
      ])
      
      if (clientsResponse.error) {
        console.warn('Supabase clients query failed:', clientsResponse.error.message)
        throw new Error('Failed to fetch clients: ' + clientsResponse.error.message)
      }
      
      const clients = clientsResponse.data
      const jobs = jobsResponse.data || []
      
      // Add job counts to clients
      const clientsWithCounts = clients.map((client: any) => ({
        ...client,
        _count: {
          jobs: jobs.filter((job: any) => job.client_id === client.id).length
        }
      }))
      
      return clientsWithCounts as Client[]
    }
  })
}

// Hook to fetch a single client by ID
export function useClient(clientId: string | null) {
  return useQuery({
    queryKey: ['clients', clientId],
    queryFn: async () => {
      if (!clientId) return null

      const response = await fetch(`/api/clients/${clientId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch client')
      }
      const client = await response.json()
      
      // Get jobs for this client
      const jobsResponse = await fetch('/api/jobs')
      const allJobs = jobsResponse.ok ? await jobsResponse.json() : []
      const clientJobs = allJobs.filter((job: any) => job.clientId === clientId)
      
      return {
        ...client,
        jobs: clientJobs,
        _count: {
          jobs: clientJobs.length
        }
      } as Client & { jobs: any[] }
    },
    enabled: !!clientId
  })
}

// Hook to create a new client
export function useCreateClient() {
  const queryClient = useQueryClient()
  const { userRole } = useAuth()
  const isDemoMode = localStorage.getItem('demo_mode') === 'true'

  return useMutation({
    mutationFn: async (newClient: CreateClientData) => {
      // Prevent demo users from creating real data
      if (isDemoMode || userRole === 'demo_viewer') {
        throw new Error('Demo users cannot create new clients. Please sign up for a real account.')
      }

      // Ensure only authorized roles can create clients
      if (!userRole || !['bd', 'admin'].includes(userRole)) {
        throw new Error('You do not have permission to create clients.')
      }

      const response = await apiRequest('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newClient,
          status: 'active' // Explicitly set as active, never demo
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create client')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    }
  })
}

// Hook to update a client
export function useUpdateClient() {
  const queryClient = useQueryClient()
  const { userRole } = useAuth()
  const isDemoMode = localStorage.getItem('demo_mode') === 'true'

  return useMutation({
    mutationFn: async (updateData: UpdateClientData) => {
      // Prevent demo users from modifying real data
      if (isDemoMode || userRole === 'demo_viewer') {
        throw new Error('Demo users cannot update clients. Please sign up for a real account.')
      }

      // Ensure only authorized roles can update clients
      if (!userRole || !['bd', 'admin'].includes(userRole)) {
        throw new Error('You do not have permission to update clients.')
      }

      const { id, ...clientData } = updateData
      
      const response = await apiRequest(`/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      })

      if (!response.ok) {
        throw new Error('Failed to update client')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] })
    }
  })
}

// Hook to delete a client
export function useDeleteClient() {
  const queryClient = useQueryClient()
  const { userRole } = useAuth()
  const isDemoMode = localStorage.getItem('demo_mode') === 'true'

  return useMutation({
    mutationFn: async (clientId: string) => {
      // Prevent demo users from deleting real data
      if (isDemoMode || userRole === 'demo_viewer') {
        throw new Error('Demo users cannot delete clients. Please sign up for a real account.')
      }

      // Ensure only admin can delete clients (high-risk operation)
      if (!userRole || userRole !== 'admin') {
        throw new Error('Only administrators can delete clients.')
      }

      const response = await apiRequest(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete client')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    }
  })
}