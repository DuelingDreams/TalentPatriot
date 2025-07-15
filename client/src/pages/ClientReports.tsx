export default function ClientReports() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Client Reports</h1>
          <p className="text-gray-600 mt-2">Detailed reporting and analytics for client relationships</p>
        </div>
        
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Client Reports</h3>
            <p className="text-gray-600 mb-6">Generate comprehensive reports on client relationships and performance</p>
            <p className="text-sm text-gray-500">Business development insights and client analytics.</p>
          </div>
        </div>
      </div>
    </div>
  )
}