export default function LeadPipeline() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Lead Pipeline</h1>
          <p className="text-gray-600 mt-2">Manage potential clients and business opportunities</p>
        </div>
        
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Lead Pipeline</h3>
            <p className="text-gray-600 mb-6">Track and convert potential business opportunities</p>
            <p className="text-sm text-gray-500">Sales funnel for new client acquisition.</p>
          </div>
        </div>
      </div>
    </div>
  )
}