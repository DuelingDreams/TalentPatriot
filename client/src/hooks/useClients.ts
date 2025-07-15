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

// Hook to fetch all clients
export function useClients() {
  const { userRole } = useAuth()
  
  return useQuery({
    queryKey: ['clients', userRole],
    queryFn: async () => {
      let clientsQuery = supabase
        .from('clients')
        .select('*')
      
      let jobsQuery = supabase
        .from('jobs')
        .select('client_id')
      
      // Filter based on user role
      if (userRole === 'demo_viewer') {
        clientsQuery = clientsQuery.eq('status', 'demo')
        jobsQuery = jobsQuery.eq('record_status', 'demo')
      } else {
        clientsQuery = clientsQuery.is('status', null).or('status.neq.demo')
        jobsQuery = jobsQuery.is('record_status', null).or('record_status.neq.demo')
      }
      
      clientsQuery = clientsQuery.order('name', { ascending: true })
      
      const [clientsResponse, jobsResponse] = await Promise.all([
        clientsQuery,
        jobsQuery
      ])
      
      if (clientsResponse.error) {
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

  return useMutation({
    mutationFn: async (newClient: CreateClientData) => {
      const response = await apiRequest('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
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

  return useMutation({
    mutationFn: async (updateData: UpdateClientData) => {
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

  return useMutation({
    mutationFn: async (clientId: string) => {
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