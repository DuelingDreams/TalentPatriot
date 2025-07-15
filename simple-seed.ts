import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runSeedScript() {
  console.log('🚀 Running direct SQL seeding...')
  
  try {
    // Read the SQL file
    const sqlContent = readFileSync('direct-seed.sql', 'utf-8')
    
    // Execute the SQL using a direct query
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error('❌ SQL execution failed:', error.message)
      
      // Fall back to programmatic seeding
      console.log('🔄 Falling back to programmatic seeding...')
      await programmaticSeed()
    } else {
      console.log('✅ SQL seeding successful')
      console.log('Data:', data)
    }
    
  } catch (error) {
    console.error('❌ Error reading SQL file:', error)
    console.log('🔄 Falling back to programmatic seeding...')
    await programmaticSeed()
  }
}

async function programmaticSeed() {
  console.log('🌱 Starting programmatic seeding...')
  
  // Delete existing demo data first
  await supabase.from('candidate_notes').delete().eq('status', 'demo')
  await supabase.from('job_candidate').delete().eq('status', 'demo')
  await supabase.from('jobs').delete().eq('record_status', 'demo')
  await supabase.from('candidates').delete().eq('status', 'demo')
  await supabase.from('clients').delete().eq('status', 'demo')
  
  // Seed clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .insert([
      {
        name: 'TechCorp Solutions',
        industry: 'Technology',
        location: 'San Francisco, CA',
        website: 'https://techcorp.demo',
        contact_name: 'Sarah Johnson',
        contact_email: 'sarah@techcorp.demo',
        contact_phone: '+1 (555) 123-4567',
        notes: 'Leading tech company specializing in AI solutions',
        status: 'demo'
      },
      {
        name: 'InnovateCo',
        industry: 'Software Development',
        location: 'Austin, TX',
        website: 'https://innovate.demo',
        contact_name: 'Michael Chen',
        contact_email: 'michael@innovate.demo',
        contact_phone: '+1 (555) 234-5678',
        notes: 'Fast-growing startup focused on mobile applications',
        status: 'demo'
      },
      {
        name: 'DataDyne Corp',
        industry: 'Data Analytics',
        location: 'New York, NY',
        website: 'https://datadyne.demo',
        contact_name: 'Emily Rodriguez',
        contact_email: 'emily@datadyne.demo',
        contact_phone: '+1 (555) 345-6789',
        notes: 'Enterprise data analytics and visualization company',
        status: 'demo'
      }
    ])
    .select()
  
  if (clientsError) {
    console.error('❌ Error seeding clients:', clientsError)
    return
  }
  
  console.log('✅ Seeded', clients.length, 'clients')
  
  // Seed candidates
  const { data: candidates, error: candidatesError } = await supabase
    .from('candidates')
    .insert([
      {
        name: 'Alex Rodriguez',
        email: 'alex.demo@example.com',
        phone: '+1 (555) 111-2222',
        resume_url: 'https://example.com/resume/alex.pdf',
        status: 'demo'
      },
      {
        name: 'Sarah Chen',
        email: 'sarah.demo@example.com',
        phone: '+1 (555) 222-3333',
        resume_url: 'https://example.com/resume/sarah.pdf',
        status: 'demo'
      },
      {
        name: 'Michael Park',
        email: 'michael.demo@example.com',
        phone: '+1 (555) 333-4444',
        resume_url: 'https://example.com/resume/michael.pdf',
        status: 'demo'
      },
      {
        name: 'Emma Wilson',
        email: 'emma.demo@example.com',
        phone: '+1 (555) 444-5555',
        resume_url: 'https://example.com/resume/emma.pdf',
        status: 'demo'
      },
      {
        name: 'David Kim',
        email: 'david.demo@example.com',
        phone: '+1 (555) 555-6666',
        resume_url: 'https://example.com/resume/david.pdf',
        status: 'demo'
      }
    ])
    .select()
  
  if (candidatesError) {
    console.error('❌ Error seeding candidates:', candidatesError)
    return
  }
  
  console.log('✅ Seeded', candidates.length, 'candidates')
  
  // Seed jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .insert([
      {
        title: 'Senior React Developer',
        description: 'We are looking for an experienced React developer to join our frontend team. Must have 5+ years of experience with React, TypeScript, and modern development practices.',
        client_id: clients[0].id,
        job_status: 'open',
        record_status: 'demo'
      },
      {
        title: 'DevOps Engineer',
        description: 'Seeking a skilled DevOps engineer to manage our cloud infrastructure. Experience with AWS, Docker, and Kubernetes required.',
        client_id: clients[1].id,
        job_status: 'open',
        record_status: 'demo'
      },
      {
        title: 'Data Scientist',
        description: 'Join our data science team to build machine learning models and analyze large datasets. PhD in Data Science or related field preferred.',
        client_id: clients[2].id,
        job_status: 'open',
        record_status: 'demo'
      },
      {
        title: 'Product Manager',
        description: 'Lead product development for our mobile app. Experience in agile methodologies and user research required.',
        client_id: clients[1].id,
        job_status: 'filled',
        record_status: 'demo'
      }
    ])
    .select()
  
  if (jobsError) {
    console.error('❌ Error seeding jobs:', jobsError)
    return
  }
  
  console.log('✅ Seeded', jobs.length, 'jobs')
  
  // Seed job-candidate relationships
  const { data: jobCandidates, error: jcError } = await supabase
    .from('job_candidate')
    .insert([
      {
        job_id: jobs[0].id,
        candidate_id: candidates[0].id,
        stage: 'applied',
        notes: 'Strong React portfolio, good communication skills',
        assigned_to: 'cd99579b-1b80-4802-9651-e881fb707583',
        status: 'demo'
      },
      {
        job_id: jobs[0].id,
        candidate_id: candidates[1].id,
        stage: 'interview',
        notes: 'Impressive technical background, scheduled for final interview',
        assigned_to: 'cd99579b-1b80-4802-9651-e881fb707583',
        status: 'demo'
      },
      {
        job_id: jobs[1].id,
        candidate_id: candidates[2].id,
        stage: 'technical',
        notes: 'Excellent AWS knowledge, completing technical assessment',
        assigned_to: 'cd99579b-1b80-4802-9651-e881fb707583',
        status: 'demo'
      },
      {
        job_id: jobs[1].id,
        candidate_id: candidates[3].id,
        stage: 'offer',
        notes: 'Strong candidate, offer extended',
        assigned_to: 'cd99579b-1b80-4802-9651-e881fb707583',
        status: 'demo'
      },
      {
        job_id: jobs[2].id,
        candidate_id: candidates[4].id,
        stage: 'screening',
        notes: 'PhD in ML, reviewing research publications',
        assigned_to: 'cd99579b-1b80-4802-9651-e881fb707583',
        status: 'demo'
      },
      {
        job_id: jobs[3].id,
        candidate_id: candidates[0].id,
        stage: 'hired',
        notes: 'Excellent product sense, started last week',
        assigned_to: 'cd99579b-1b80-4802-9651-e881fb707583',
        status: 'demo'
      }
    ])
    .select()
  
  if (jcError) {
    console.error('❌ Error seeding job-candidate relationships:', jcError)
    return
  }
  
  console.log('✅ Seeded', jobCandidates.length, 'job-candidate relationships')
  
  // Seed candidate notes
  const { data: notes, error: notesError } = await supabase
    .from('candidate_notes')
    .insert([
      {
        job_candidate_id: jobCandidates[0].id,
        author_id: 'cd99579b-1b80-4802-9651-e881fb707583',
        content: 'Initial screening call went well. Candidate has strong React experience and good problem-solving skills.',
        status: 'demo'
      },
      {
        job_candidate_id: jobCandidates[1].id,
        author_id: 'cd99579b-1b80-4802-9651-e881fb707583',
        content: 'Technical interview completed successfully. Moving to final round with team lead.',
        status: 'demo'
      },
      {
        job_candidate_id: jobCandidates[2].id,
        author_id: 'cd99579b-1b80-4802-9651-e881fb707583',
        content: 'Candidate demonstrated excellent knowledge of containerization and CI/CD pipelines.',
        status: 'demo'
      },
      {
        job_candidate_id: jobCandidates[3].id,
        author_id: 'cd99579b-1b80-4802-9651-e881fb707583',
        content: 'Reference checks completed successfully. Extending offer with competitive package.',
        status: 'demo'
      }
    ])
    .select()
  
  if (notesError) {
    console.error('❌ Error seeding candidate notes:', notesError)
    return
  }
  
  console.log('✅ Seeded', notes.length, 'candidate notes')
  
  // Test the data
  console.log('🧪 Testing seeded data...')
  
  const { data: testClients } = await supabase.from('clients').select('*').eq('status', 'demo')
  const { data: testJobs } = await supabase.from('jobs').select('*').eq('record_status', 'demo')
  const { data: testCandidates } = await supabase.from('candidates').select('*').eq('status', 'demo')
  const { data: testJobCandidates } = await supabase.from('job_candidate').select('*').eq('status', 'demo')
  const { data: testNotes } = await supabase.from('candidate_notes').select('*').eq('status', 'demo')
  
  console.log('✅ Final data counts:')
  console.log(`   Clients: ${testClients?.length || 0}`)
  console.log(`   Jobs: ${testJobs?.length || 0}`)
  console.log(`   Candidates: ${testCandidates?.length || 0}`)
  console.log(`   Job-Candidates: ${testJobCandidates?.length || 0}`)
  console.log(`   Notes: ${testNotes?.length || 0}`)
  
  console.log('\n🎉 Demo data seeding complete!')
}

runSeedScript().catch(console.error)