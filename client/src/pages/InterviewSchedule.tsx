export default function InterviewSchedule() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Interview Schedule</h1>
          <p className="text-gray-600 mt-2">Manage upcoming interviews and scheduling</p>
        </div>
        
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Interview Schedule</h3>
            <p className="text-gray-600 mb-6">View and manage all scheduled interviews</p>
            <p className="text-sm text-gray-500">Calendar view of upcoming candidate interviews.</p>
          </div>
        </div>
      </div>
    </div>
  )
}