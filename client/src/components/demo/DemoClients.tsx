import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building2, Search, Globe, Mail, Phone, MapPin, Users, User,
  Briefcase, Info, ExternalLink
} from 'lucide-react'
import { demoClients } from '@/lib/demo-data'

export function DemoClients() {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredClients = demoClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="tp-container space-y-6">
      {/* Demo Alert */}
      <Alert className="border-tp-accent/20 bg-tp-accent/5">
        <Info className="w-4 h-4 text-tp-accent" />
        <AlertDescription className="text-neutral-900">
          <strong>Demo Mode:</strong> Viewing sample client data. All client information is fictional for demonstration purposes.
        </AlertDescription>
      </Alert>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
        <Input
          placeholder="Search clients by name, industry, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card">
          <CardHeader className="pb-3">
            <CardTitle className="tp-label text-neutral-600">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{demoClients.length}</div>
            <p className="text-xs text-neutral-600 mt-1">Active partnerships</p>
          </CardContent>
        </Card>
        
        <Card className="card">
          <CardHeader className="pb-3">
            <CardTitle className="tp-label text-neutral-600">Industries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">3</div>
            <p className="text-xs text-neutral-600 mt-1">Diverse sectors</p>
          </CardContent>
        </Card>
        
        <Card className="card">
          <CardHeader className="pb-3">
            <CardTitle className="tp-label text-neutral-600">Open Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">5</div>
            <p className="text-xs text-neutral-600 mt-1">Across all clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="card hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-tp-accent/10 to-tp-accent/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-tp-accent" />
                  </div>
                  <div>
                    <CardTitle className="tp-h2 text-neutral-900">{client.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1 bg-tp-card-surface text-neutral-600">
                      {client.industry}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="tp-body text-neutral-600">{client.notes}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-neutral-600">
                  <MapPin className="w-4 h-4" />
                  <span>{client.location}</span>
                </div>
                
                {client.website && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Globe className="w-4 h-4" />
                    <span className="truncate">{client.website}</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
                
                {client.contactName && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <User className="w-4 h-4" />
                    <span>{client.contactName}</span>
                  </div>
                )}
                
                {client.contactEmail && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{client.contactEmail}</span>
                  </div>
                )}
              </div>
              
              <div className="pt-3 border-t border-tp-card-surface">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Briefcase className="w-4 h-4" />
                    <span className="text-sm">5 open positions</span>
                  </div>
                  <Button size="sm" variant="outline" className="btn-secondary text-xs">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}