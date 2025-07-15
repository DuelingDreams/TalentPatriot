export default function MyAssignments() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-gray-600 mt-2">View and manage your assigned candidates and jobs</p>
        </div>
        
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">My Assignments</h3>
            <p className="text-gray-600 mb-6">Track candidates and jobs assigned specifically to you</p>
            <p className="text-sm text-gray-500">This feature shows recruiters their assigned work items.</p>
          </div>
        </div>
      </div>
    </div>
  )
}