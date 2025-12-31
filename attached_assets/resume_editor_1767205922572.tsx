import React, { useState } from 'react';
import { Edit2, Plus, Trash2, Download, Copy, Search, Star, FileText, MessageSquare, Mail, Phone, MapPin } from 'lucide-react';

export default function ATSCRMSystem() {
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState({});
  const [campaigns, setCampaigns] = useState([]);
  
  const [candidate, setCandidate] = useState({
    id: 1,
    personalInfo: {
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "(555) 123-4567",
      location: "Washington, DC"
    },
    status: "active",
    stage: "interviewing",
    rating: 4,
    desiredSalary: "$140,000 - $160,000",
    availability: "2 weeks notice",
    summary: "Senior Backend Software Engineer with 7+ years of experience designing, building, and scaling distributed backend systems. Deep expertise in API design, microservices, cloud infrastructure, databases, and performance optimization.",
    experiences: [
      {
        id: 1,
        title: "Senior Backend Software Engineer",
        company: "TechNova Systems",
        period: "Jan 2021 - Present",
        location: "Remote",
        description: "Designed and deployed microservices architecture supporting 10M+ monthly users. Built scalable REST and GraphQL APIs that reduced latency by 35% and increased throughput by 50%."
      },
      {
        id: 2,
        title: "Backend Software Engineer",
        company: "CloudForge Technologies",
        period: "Aug 2018 - Dec 2020",
        location: "Washington, DC",
        description: "Built backend services in Node.js and Go for a real-time analytics platform used by enterprise clients."
      }
    ],
    skills: ["AWS", "Azure", "Docker", "Go", "GraphQL", "Kafka", "Kubernetes", "Node.js", "Python"],
    submissions: [
      {
        id: 1,
        client: "TechCorp Inc",
        position: "Senior Backend Engineer",
        date: "2024-12-15",
        status: "interviewing",
        rate: "$85/hr",
        feedback: "Client impressed with technical depth"
      }
    ],
    notes: [
      {
        id: 1,
        date: "2024-12-20",
        author: "Recruiter Sarah",
        text: "Great phone screen. Very strong technical background. Interested in remote positions only."
      }
    ],
    documents: [
      { id: 1, name: "Resume_JohnSmith.pdf", uploadDate: "2024-12-01" }
    ],
    campaigns: [
      {
        id: 1,
        name: "New Candidate Welcome Series",
        status: "active",
        enrolled: "2024-12-01",
        emails: [
          { id: 1, subject: "Welcome to our network!", day: 0, sent: true, sentDate: "2024-12-01" },
          { id: 2, subject: "Profile tips & best practices", day: 3, sent: true, sentDate: "2024-12-04" },
          { id: 3, subject: "Hot job opportunities", day: 7, sent: false, scheduledDate: "2024-12-08" }
        ]
      }
    ]
  });

  const StatusBadge = ({ status }) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      placed: "bg-blue-100 text-blue-800",
      archived: "bg-gray-100 text-gray-800"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.active}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const StageBadge = ({ stage }) => {
    const colors = {
      sourced: "bg-purple-100 text-purple-800",
      screening: "bg-yellow-100 text-yellow-800",
      interviewing: "bg-blue-100 text-blue-800",
      submitted: "bg-orange-100 text-orange-800",
      offer: "bg-green-100 text-green-800"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[stage] || colors.sourced}`}>
        {stage.charAt(0).toUpperCase() + stage.slice(1)}
      </span>
    );
  };

  const addNote = () => {
    const newNote = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      author: "Current User",
      text: ""
    };
    setCandidate(prev => ({
      ...prev,
      notes: [newNote, ...prev.notes]
    }));
    setEditMode(prev => ({ ...prev, [`note-${newNote.id}`]: true }));
  };

  const updateNote = (id, text) => {
    setCandidate(prev => ({
      ...prev,
      notes: prev.notes.map(note => 
        note.id === id ? { ...note, text } : note
      )
    }));
  };

  const addSubmission = () => {
    const newSub = {
      id: Date.now(),
      client: "",
      position: "",
      date: new Date().toISOString().split('T')[0],
      status: "submitted",
      rate: "",
      feedback: ""
    };
    setCandidate(prev => ({
      ...prev,
      submissions: [...prev.submissions, newSub]
    }));
    setEditMode(prev => ({ ...prev, [`sub-${newSub.id}`]: true }));
  };

  const updateSubmission = (id, field, value) => {
    setCandidate(prev => ({
      ...prev,
      submissions: prev.submissions.map(sub => 
        sub.id === id ? { ...sub, [field]: value } : sub
      )
    }));
  };

  const exportData = () => {
    const json = JSON.stringify(candidate, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidate-${candidate.id}.json`;
    a.click();
  };

  const addCampaignEmail = (campaignId) => {
    const campaign = candidate.campaigns.find(c => c.id === campaignId);
    const maxDay = Math.max(...campaign.emails.map(e => e.day), 0);
    const newEmail = {
      id: Date.now(),
      subject: "",
      day: maxDay + 1,
      sent: false,
      scheduledDate: ""
    };
    setCandidate(prev => ({
      ...prev,
      campaigns: prev.campaigns.map(c => 
        c.id === campaignId ? { ...c, emails: [...c.emails, newEmail] } : c
      )
    }));
    setEditMode(prev => ({ ...prev, [`email-${newEmail.id}`]: true }));
  };

  const updateCampaignEmail = (campaignId, emailId, field, value) => {
    setCandidate(prev => ({
      ...prev,
      campaigns: prev.campaigns.map(c => 
        c.id === campaignId ? {
          ...c,
          emails: c.emails.map(e => e.id === emailId ? { ...e, [field]: value } : e)
        } : c
      )
    }));
  };

  const deleteCampaignEmail = (campaignId, emailId) => {
    setCandidate(prev => ({
      ...prev,
      campaigns: prev.campaigns.map(c => 
        c.id === campaignId ? {
          ...c,
          emails: c.emails.filter(e => e.id !== emailId)
        } : c
      )
    }));
  };

  const enrollInCampaign = () => {
    const newCampaign = {
      id: Date.now(),
      name: "",
      status: "active",
      enrolled: new Date().toISOString().split('T')[0],
      emails: []
    };
    setCandidate(prev => ({
      ...prev,
      campaigns: [...prev.campaigns, newCampaign]
    }));
    setEditMode(prev => ({ ...prev, [`campaign-${newCampaign.id}`]: true }));
  };

  const updateCampaign = (id, field, value) => {
    setCandidate(prev => ({
      ...prev,
      campaigns: prev.campaigns.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Staffing ATS/CRM</h1>
          <div className="flex gap-2">
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(candidate))} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
              <Copy size={18} />
              Copy
            </button>
            <button onClick={exportData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Candidate Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{candidate.personalInfo.name}</h2>
              <p className="text-lg text-gray-700 mb-3">{candidate.experiences[0]?.title}</p>
              <div className="flex gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1"><Mail size={16} />{candidate.personalInfo.email}</span>
                <span className="flex items-center gap-1"><Phone size={16} />{candidate.personalInfo.phone}</span>
                <span className="flex items-center gap-1"><MapPin size={16} />{candidate.personalInfo.location}</span>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <StatusBadge status={candidate.status} />
              <StageBadge stage={candidate.stage} />
              <div className="flex ml-2">
                {[1,2,3,4,5].map(i => (
                  <Star 
                    key={i}
                    size={20}
                    className={i <= candidate.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Desired Salary</div>
              <div className="font-semibold text-gray-900">{candidate.desiredSalary}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Availability</div>
              <div className="font-semibold text-gray-900">{candidate.availability}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Submissions</div>
              <div className="font-semibold text-gray-900">{candidate.submissions.length} Active</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Experience</div>
              <div className="font-semibold text-gray-900">7+ Years</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-lg border-b border-gray-200">
          <div className="flex gap-6 px-6">
            {['overview', 'submissions', 'campaigns', 'notes', 'documents'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-600'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-lg shadow-sm p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Professional Summary</h3>
                <p className="text-gray-700">{candidate.summary}</p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Work Experience</h3>
                <div className="space-y-6">
                  {candidate.experiences.map((exp, idx) => (
                    <div key={exp.id} className={idx > 0 ? 'pt-6 border-t border-gray-200' : ''}>
                      <h4 className="text-lg font-semibold text-gray-900">{exp.title}</h4>
                      <p className="text-gray-700 font-medium">{exp.company}</p>
                      <p className="text-sm text-gray-600 mb-2">{exp.period} • {exp.location}</p>
                      <p className="text-gray-700">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Client Submissions</h3>
                <button onClick={addSubmission} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Plus size={18} />
                  Add
                </button>
              </div>
              <div className="space-y-4">
                {candidate.submissions.map(sub => (
                  <div key={sub.id} className="border border-gray-200 rounded-lg p-4">
                    {editMode[`sub-${sub.id}`] ? (
                      <div className="space-y-3">
                        <input
                          value={sub.client}
                          onChange={(e) => updateSubmission(sub.id, 'client', e.target.value)}
                          placeholder="Client Name"
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                        <input
                          value={sub.position}
                          onChange={(e) => updateSubmission(sub.id, 'position', e.target.value)}
                          placeholder="Position"
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="date"
                            value={sub.date}
                            onChange={(e) => updateSubmission(sub.id, 'date', e.target.value)}
                            className="p-2 border border-gray-300 rounded"
                          />
                          <input
                            value={sub.rate}
                            onChange={(e) => updateSubmission(sub.id, 'rate', e.target.value)}
                            placeholder="Rate"
                            className="p-2 border border-gray-300 rounded"
                          />
                        </div>
                        <textarea
                          value={sub.feedback}
                          onChange={(e) => updateSubmission(sub.id, 'feedback', e.target.value)}
                          placeholder="Feedback"
                          className="w-full p-2 border border-gray-300 rounded"
                          rows={2}
                        />
                        <button
                          onClick={() => setEditMode(prev => ({ ...prev, [`sub-${sub.id}`]: false }))}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{sub.position}</h4>
                          <p className="text-gray-700">{sub.client}</p>
                          <p className="text-sm text-gray-600 mt-1">{sub.date} • {sub.rate}</p>
                          {sub.feedback && <p className="text-sm text-gray-600 mt-2 italic">"{sub.feedback}"</p>}
                        </div>
                        <div className="flex gap-2 items-start">
                          <StageBadge stage={sub.status} />
                          <button onClick={() => setEditMode(prev => ({ ...prev, [`sub-${sub.id}`]: true }))} className="text-blue-600">
                            <Edit2 size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Drip Campaigns</h3>
                <button onClick={enrollInCampaign} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Plus size={18} />
                  Enroll in Campaign
                </button>
              </div>
              <div className="space-y-6">
                {candidate.campaigns.map(campaign => (
                  <div key={campaign.id} className="border border-gray-200 rounded-lg p-6">
                    {editMode[`campaign-${campaign.id}`] ? (
                      <div className="mb-4">
                        <input
                          value={campaign.name}
                          onChange={(e) => updateCampaign(campaign.id, 'name', e.target.value)}
                          placeholder="Campaign Name"
                          className="w-full p-2 border border-gray-300 rounded mb-2"
                        />
                        <select
                          value={campaign.status}
                          onChange={(e) => updateCampaign(campaign.id, 'status', e.target.value)}
                          className="p-2 border border-gray-300 rounded"
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{campaign.name}</h4>
                          <p className="text-sm text-gray-600">Enrolled: {campaign.enrolled}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                          <button onClick={() => setEditMode(prev => ({ ...prev, [`campaign-${campaign.id}`]: !prev[`campaign-${campaign.id}`] }))} className="text-blue-600">
                            <Edit2 size={18} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-semibold text-gray-900">Email Sequence</h5>
                        <button onClick={() => addCampaignEmail(campaign.id)} className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
                          <Plus size={14} />
                          Add Email
                        </button>
                      </div>
                      <div className="space-y-3">
                        {campaign.emails.map((email, idx) => (
                          <div key={email.id} className="bg-white border border-gray-200 rounded p-3">
                            {editMode[`email-${email.id}`] ? (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    value={email.day}
                                    onChange={(e) => updateCampaignEmail(campaign.id, email.id, 'day', parseInt(e.target.value))}
                                    placeholder="Day"
                                    className="w-20 p-2 border border-gray-300 rounded"
                                  />
                                  <input
                                    value={email.subject}
                                    onChange={(e) => updateCampaignEmail(campaign.id, email.id, 'subject', e.target.value)}
                                    placeholder="Email Subject"
                                    className="flex-1 p-2 border border-gray-300 rounded"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditMode(prev => ({ ...prev, [`email-${email.id}`]: false }))}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => deleteCampaignEmail(campaign.id, email.id)}
                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{email.subject}</p>
                                    <p className="text-sm text-gray-600">
                                      Day {email.day} • {email.sent ? `Sent ${email.sentDate}` : `Scheduled ${email.scheduledDate || 'TBD'}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    email.sent ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {email.sent ? 'Sent' : 'Scheduled'}
                                  </span>
                                  <button onClick={() => setEditMode(prev => ({ ...prev, [`email-${email.id}`]: true }))} className="text-blue-600">
                                    <Edit2 size={16} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Activity & Notes</h3>
                <button onClick={addNote} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Plus size={18} />
                  Add Note
                </button>
              </div>
              <div className="space-y-4">
                {candidate.notes.map(note => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="text-gray-400 mt-1" size={20} />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium text-gray-900">{note.author}</span>
                            <span className="text-sm text-gray-600 ml-2">{note.date}</span>
                          </div>
                          <button onClick={() => setEditMode(prev => ({ ...prev, [`note-${note.id}`]: !prev[`note-${note.id}`] }))} className="text-blue-600">
                            <Edit2 size={16} />
                          </button>
                        </div>
                        {editMode[`note-${note.id}`] ? (
                          <textarea
                            value={note.text}
                            onChange={(e) => updateNote(note.id, e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded"
                            rows={3}
                            placeholder="Add note..."
                          />
                        ) : (
                          <p className="text-gray-700">{note.text}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Documents</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Plus size={18} />
                  Upload
                </button>
              </div>
              <div className="space-y-2">
                {candidate.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="text-gray-400" size={24} />
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-600">Uploaded: {doc.uploadDate}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Download size={18} />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}