import React, { useState } from 'react';
import { Search, Plus, Filter, MoreVertical, Building2, Users, Briefcase, DollarSign, Mail, Phone, Calendar, FileText, TrendingUp, TrendingDown, Percent, Target } from 'lucide-react';

const ClientsPage = () => {
  const [view, setView] = useState('list');
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const clients = [
    {
      id: 1,
      name: 'TechCorp Solutions',
      logo: 'TC',
      status: 'Active',
      industry: 'Technology',
      contact: 'Sarah Johnson',
      email: 'sarah@techcorp.com',
      phone: '(555) 123-4567',
      openJobs: 3,
      placements: 12,
      revenue: 145000,
      grossProfit: 52200,
      avgMargin: 36,
      lastContact: '2 days ago',
      priority: 'High',
      paymentTerms: 'Net 30',
      placements_detail: [
        { role: 'Senior Developer', billRate: 95, payRate: 65, type: 'Contract', duration: '6 months', status: 'Active' },
        { role: 'QA Engineer', billRate: 75, payRate: 52, type: 'Contract', duration: '12 months', status: 'Active' },
        { role: 'Product Manager', salary: 120000, fee: 24000, type: 'Direct Hire', status: 'Placed' }
      ],
      marginTrend: 'up'
    },
    {
      id: 2,
      name: 'Healthcare Partners LLC',
      logo: 'HP',
      status: 'Active',
      industry: 'Healthcare',
      contact: 'Michael Chen',
      email: 'mchen@healthcare.com',
      phone: '(555) 234-5678',
      openJobs: 5,
      placements: 8,
      revenue: 98500,
      grossProfit: 29550,
      avgMargin: 30,
      lastContact: '5 days ago',
      priority: 'High',
      paymentTerms: 'Net 45',
      placements_detail: [
        { role: 'Registered Nurse', billRate: 68, payRate: 52, type: 'Contract', duration: '13 weeks', status: 'Active' },
        { role: 'Medical Assistant', billRate: 42, payRate: 32, type: 'Contract', duration: '26 weeks', status: 'Active' }
      ],
      marginTrend: 'stable'
    },
    {
      id: 3,
      name: 'Retail Dynamics Inc',
      logo: 'RD',
      status: 'Prospect',
      industry: 'Retail',
      contact: 'Emily Rodriguez',
      email: 'emily@retaildynamics.com',
      phone: '(555) 345-6789',
      openJobs: 0,
      placements: 0,
      revenue: 0,
      grossProfit: 0,
      avgMargin: 0,
      lastContact: '1 week ago',
      priority: 'Medium',
      paymentTerms: 'TBD',
      placements_detail: [],
      marginTrend: 'stable'
    },
    {
      id: 4,
      name: 'Financial Services Group',
      logo: 'FS',
      status: 'Active',
      industry: 'Finance',
      contact: 'David Park',
      email: 'dpark@finservices.com',
      phone: '(555) 456-7890',
      openJobs: 2,
      placements: 15,
      revenue: 187000,
      grossProfit: 74800,
      avgMargin: 40,
      lastContact: '3 days ago',
      priority: 'High',
      paymentTerms: 'Net 30',
      placements_detail: [
        { role: 'Financial Analyst', billRate: 85, payRate: 55, type: 'Contract', duration: '12 months', status: 'Active' },
        { role: 'Compliance Officer', salary: 95000, fee: 19000, type: 'Direct Hire', status: 'Placed' }
      ],
      marginTrend: 'up'
    },
    {
      id: 5,
      name: 'Manufacturing Co',
      logo: 'MC',
      status: 'Inactive',
      industry: 'Manufacturing',
      contact: 'Lisa Thompson',
      email: 'lisa@mfgco.com',
      phone: '(555) 567-8901',
      openJobs: 0,
      placements: 4,
      revenue: 42000,
      grossProfit: 10500,
      avgMargin: 25,
      lastContact: '2 months ago',
      priority: 'Low',
      paymentTerms: 'Net 60',
      placements_detail: [],
      marginTrend: 'down'
    }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Prospect': return 'bg-blue-100 text-blue-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMarginColor = (margin) => {
    if (margin >= 35) return 'text-green-600';
    if (margin >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp size={16} className="text-green-600" />;
    if (trend === 'down') return <TrendingDown size={16} className="text-red-600" />;
    return <div className="w-4 h-0.5 bg-gray-400"></div>;
  };

  const totalGrossProfit = clients.reduce((sum, c) => sum + c.grossProfit, 0);
  const avgMarginAcrossClients = clients.filter(c => c.revenue > 0).reduce((sum, c, _, arr) => sum + c.avgMargin / arr.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
              <p className="text-sm text-gray-600 mt-1">{clients.length} total clients</p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={20} />
              Add Client
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search clients..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter size={20} />
              Filter
            </button>
            <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
              <button 
                onClick={() => setView('list')}
                className={`px-3 py-1 rounded ${view === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                List
              </button>
              <button 
                onClick={() => setView('kanban')}
                className={`px-3 py-1 rounded ${view === 'kanban' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Kanban
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-5 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Clients</p>
                <p className="text-xl font-semibold">{clients.filter(c => c.status === 'Active').length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Open Jobs</p>
                <p className="text-xl font-semibold">{clients.reduce((sum, c) => sum + c.openJobs, 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-semibold">{formatCurrency(clients.reduce((sum, c) => sum + c.revenue, 0))}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Target className="text-emerald-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Gross Profit</p>
                <p className="text-xl font-semibold">{formatCurrency(totalGrossProfit)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Percent className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Margin</p>
                <p className="text-xl font-semibold">{avgMarginAcrossClients.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {view === 'list' ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open Jobs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placements</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Margin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedClient(client)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-semibold">
                          {client.logo}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          <p className="text-sm text-gray-500">{client.industry}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{client.openJobs}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{client.placements}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(client.revenue)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-emerald-600">{formatCurrency(client.grossProfit)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${getMarginColor(client.avgMargin)}`}>
                        {client.avgMargin}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        {getTrendIcon(client.marginTrend)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-gray-600" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {/* Prospect Column */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Prospect</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {clients.filter(c => c.status === 'Prospect').length}
                </span>
              </div>
              <div className="space-y-3">
                {clients.filter(c => c.status === 'Prospect').map(client => (
                  <div key={client.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedClient(client)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-semibold text-sm">
                          {client.logo}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          <p className="text-xs text-gray-500">{client.industry}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600">{client.contact}</p>
                      <p className="text-xs text-gray-500">Last contact: {client.lastContact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Column */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Active</h3>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {clients.filter(c => c.status === 'Active').length}
                </span>
              </div>
              <div className="space-y-3">
                {clients.filter(c => c.status === 'Active').map(client => (
                  <div key={client.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedClient(client)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-semibold text-sm">
                          {client.logo}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          <p className="text-xs text-gray-500">{client.industry}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Open Jobs:</span>
                        <span className="font-medium">{client.openJobs}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Gross Profit:</span>
                        <span className="font-medium text-emerald-600">{formatCurrency(client.grossProfit)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Margin:</span>
                        <span className={`font-semibold ${getMarginColor(client.avgMargin)}`}>{client.avgMargin}%</span>
                      </div>
                      <p className="text-xs text-gray-500">Last contact: {client.lastContact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inactive Column */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Inactive</h3>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                  {clients.filter(c => c.status === 'Inactive').length}
                </span>
              </div>
              <div className="space-y-3">
                {clients.filter(c => c.status === 'Inactive').map(client => (
                  <div key={client.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedClient(client)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-400 text-white rounded-lg flex items-center justify-center font-semibold text-sm">
                          {client.logo}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          <p className="text-xs text-gray-500">{client.industry}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600">{client.contact}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Past Revenue:</span>
                        <span className="text-gray-500">{formatCurrency(client.revenue)}</span>
                      </div>
                      <p className="text-xs text-gray-500">Last contact: {client.lastContact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedClient(null)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-lg flex items-center justify-center font-semibold text-xl">
                    {selectedClient.logo}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">{selectedClient.name}</h2>
                    <p className="text-gray-600">{selectedClient.industry}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedClient.status)}`}>
                        {selectedClient.status}
                      </span>
                      <span className="text-xs text-gray-500">Payment Terms: {selectedClient.paymentTerms}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedClient(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                  ×
                </button>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus size={16} />
                  New Job
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Mail size={16} />
                  Email
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Phone size={16} />
                  Call
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex gap-6 px-6">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`py-3 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
                >
                  Overview
                </button>
                <button 
                  onClick={() => setActiveTab('placements')}
                  className={`py-3 border-b-2 font-medium text-sm ${activeTab === 'placements' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
                >
                  Placements ({selectedClient.placements_detail.length})
                </button>
                <button 
                  onClick={() => setActiveTab('financials')}
                  className={`py-3 border-b-2 font-medium text-sm ${activeTab === 'financials' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
                >
                  Financials
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Primary Contact</p>
                        <p className="font-medium">{selectedClient.contact}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-medium">{selectedClient.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Phone</p>
                        <p className="font-medium">{selectedClient.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Last Contact</p>
                        <p className="font-medium">{selectedClient.lastContact}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Performance Metrics</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Open Jobs</p>
                        <p className="text-2xl font-semibold text-gray-900">{selectedClient.openJobs}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total Placements</p>
                        <p className="text-2xl font-semibold text-gray-900">{selectedClient.placements}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Revenue</p>
                        <p className="text-2xl font-semibold text-gray-900">{formatCurrency(selectedClient.revenue)}</p>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Gross Profit</p>
                        <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(selectedClient.grossProfit)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Profitability</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-600">Average Margin</p>
                          {getTrendIcon(selectedClient.marginTrend)}
                        </div>
                        <p className={`text-3xl font-bold ${getMarginColor(selectedClient.avgMargin)}`}>
                          {selectedClient.avgMargin}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Industry avg: 30%</p>
                      </div>
                      <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Profit per Placement</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {selectedClient.placements > 0 ? formatCurrency(selectedClient.grossProfit / selectedClient.placements) : '$0'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Across {selectedClient.placements} placements</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'placements' && (
                <div className="space-y-4">
                  {selectedClient.placements_detail.length > 0 ? (
                    selectedClient.placements_detail.map((placement, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{placement.role}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${placement.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {placement.status}
                              </span>
                              <span className="text-xs text-gray-500">{placement.type}</span>
                              {placement.duration && <span className="text-xs text-gray-500">• {placement.duration}</span>}
                            </div>
                          </div>
                        </div>
                        {placement.type === 'Contract' ? (
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Bill Rate</p>
                              <p className="font-semibold text-gray-900">${placement.billRate}/hr</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Pay Rate</p>
                              <p className="font-semibold text-gray-900">${placement.payRate}/hr</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Margin</p>
                              <p className={`font-semibold ${getMarginColor(((placement.billRate - placement.payRate) / placement.billRate) * 100)}`}>
                                ${placement.billRate - placement.payRate}/hr
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Margin %</p>
                              <p className={`font-semibold ${getMarginColor(((placement.billRate - placement.payRate) / placement.billRate) * 100)}`}>
                                {(((placement.billRate - placement.payRate) / placement.billRate) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Salary</p>
                              <p className="font-semibold text-gray-900">{formatCurrency(placement.salary)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Placement Fee</p>
                              <p className="font-semibold text-emerald-600">{formatCurrency(placement.fee)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Fee %</p>
                              <p className="font-semibold text-gray-900">{((placement.fee / placement.salary) * 100).toFixed(0)}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Briefcase size={48} className="mx-auto mb-3 text-gray-300" />
                      <p>No placements yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'financials' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Financial Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Revenue (YTD)</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedClient.revenue)}</p>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Gross Profit (YTD)</p>
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedClient.grossProfit)}</p>
                      </div>
                      <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Average Margin</p>
                        <p className={`text-2xl font-bold ${getMarginColor(selectedClient.avgMargin)}`}>
                          {selectedClient.avgMargin}%
                        </p>
                      </div>
                      <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Payment Terms</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedClient.paymentTerms}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Revenue Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">Contract Staffing</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(selectedClient.placements_detail
                            .filter(p => p.type === 'Contract')
                            .reduce((sum, p) => sum + (p.billRate * 2080 * 0.5), 0))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">Direct Hire Fees</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(selectedClient.placements_detail
                            .filter(p => p.type === 'Direct Hire')
                            .reduce((sum, p) => sum + p.fee, 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Key Insights</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-gray-900">High-Value Client</p>
                          <p className="text-sm text-gray-600">Above average margin of {selectedClient.avgMargin}% compared to company average of 30%</p>
                        </div>
                      </div>
                      {selectedClient.marginTrend === 'up' && (
                        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                          <div>
                            <p className="font-medium text-gray-900">Improving Margins</p>
                            <p className="text-sm text-gray-600">Profitability trending upward over recent placements</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;