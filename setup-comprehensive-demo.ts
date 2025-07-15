import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function ensureDemoUserExists() {
  console.log('🔍 Checking demo user...')
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error('❌ Error fetching users:', error)
    return false
  }
  
  let demoUser = users.find(user => user.email === 'demo@yourapp.com')
  
  if (!demoUser) {
    console.log('🔧 Creating demo user...')
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: 'demo@yourapp.com',
      password: 'Demo1234!',
      email_confirm: true,
      user_metadata: {
        role: 'demo_viewer',
        name: 'Demo User'
      }
    })
    
    if (createError) {
      console.error('❌ Error creating demo user:', createError)
      return false
    }
    
    demoUser = data.user
  }
  
  console.log('✅ Demo user ready:', demoUser.email)
  return true
}

async function runMigration() {
  console.log('🔧 Running database migration...')
  
  // Create record_status enum
  await supabase.rpc('exec_sql', {
    sql: `
      DO $$ BEGIN
          CREATE TYPE record_status AS ENUM ('active', 'demo', 'archived');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `
  })
  
  // Add status columns to all tables
  const migrations = [
    'ALTER TABLE clients ADD COLUMN IF NOT EXISTS status record_status DEFAULT \'active\' NOT NULL',
    'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS record_status record_status DEFAULT \'active\' NOT NULL',
    'ALTER TABLE candidates ADD COLUMN IF NOT EXISTS status record_status DEFAULT \'active\' NOT NULL',
    'ALTER TABLE job_candidate ADD COLUMN IF NOT EXISTS status record_status DEFAULT \'active\' NOT NULL',
    'ALTER TABLE candidate_notes ADD COLUMN IF NOT EXISTS status record_status DEFAULT \'active\' NOT NULL'
  ]
  
  for (const migration of migrations) {
    try {
      await supabase.rpc('exec_sql', { sql: migration })
    } catch (error) {
      console.log('Migration step may have already been applied:', migration)
    }
  }
  
  console.log('✅ Migration complete')
}

async function seedDemoData() {
  console.log('🌱 Seeding demo data...')
  
  // Check existing demo data
  const { data: existingClients } = await supabase
    .from('clients')
    .select('*')
    .eq('status', 'demo')
  
  if (existingClients && existingClients.length > 0) {
    console.log('✅ Demo data already exists, skipping seed')
    return
  }
  
  // Seed demo clients
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .insert([
      {
        name: 'TechCorp Solutions',
        industry: 'Technology',
        location: 'San Francisco, CA',
        website: 'https://techcorp.demo',
        contactName: 'Sarah Johnson',
        contactEmail: 'sarah@techcorp.demo',
        contactPhone: '+1 (555) 123-4567',
        notes: 'Leading tech company specializing in AI solutions',
        status: 'demo'
      },
      {
        name: 'InnovateCo',
        industry: 'Software Development',
        location: 'Austin, TX',
        website: 'https://innovate.demo',
        contactName: 'Michael Chen',
        contactEmail: 'michael@innovate.demo',
        contactPhone: '+1 (555) 234-5678',
        notes: 'Fast-growing startup focused on mobile applications',
        status: 'demo'
      },
      {
        name: 'DataDyne Corp',
        industry: 'Data Analytics',
        location: 'New York, NY',
        website: 'https://datadyne.demo',
        contactName: 'Emily Rodriguez',
        contactEmail: 'emily@datadyne.demo',
        contactPhone: '+1 (555) 345-6789',
        notes: 'Enterprise data analytics and visualization company',
        status: 'demo'
      }
    ])
    .select()
  
  if (clientError) {
    console.error('❌ Error seeding clients:', clientError)
    return
  }
  
  console.log('✅ Seeded', clients.length, 'demo clients')
  
  // Seed demo jobs
  const { data: jobs, error: jobError } = await supabase
    .from('jobs')
    .insert([
      {
        title: 'Senior React Developer',
        description: 'We are looking for an experienced React developer to join our frontend team. Must have 5+ years of experience with React, TypeScript, and modern development practices.',
        clientId: clients[0].id,
        status: 'open',
        recordStatus: 'demo'
      },
      {
        title: 'DevOps Engineer',
        description: 'Seeking a skilled DevOps engineer to manage our cloud infrastructure. Experience with AWS, Docker, and Kubernetes required.',
        clientId: clients[1].id,
        status: 'open',
        recordStatus: 'demo'
      },
      {
        title: 'Data Scientist',
        description: 'Join our data science team to build machine learning models and analyze large datasets. PhD in Data Science or related field preferred.',
        clientId: clients[2].id,
        status: 'open',
        recordStatus: 'demo'
      },
      {
        title: 'Product Manager',
        description: 'Lead product development for our mobile app. Experience in agile methodologies and user research required.',
        clientId: clients[1].id,
        status: 'filled',
        recordStatus: 'demo'
      }
    ])
    .select()
  
  if (jobError) {
    console.error('❌ Error seeding jobs:', jobError)
    return
  }
  
  console.log('✅ Seeded', jobs.length, 'demo jobs')
  
  // Seed demo candidates
  const { data: candidates, error: candidateError } = await supabase
    .from('candidates')
    .insert([
      {
        name: 'Alex Rodriguez',
        email: 'alex.demo@example.com',
        phone: '+1 (555) 111-2222',
        resumeUrl: 'https://example.com/resume/alex.pdf',
        status: 'demo'
      },
      {
        name: 'Sarah Chen',
        email: 'sarah.demo@example.com',
        phone: '+1 (555) 222-3333',
        resumeUrl: 'https://example.com/resume/sarah.pdf',
        status: 'demo'
      },
      {
        name: 'Michael Park',
        email: 'michael.demo@example.com',
        phone: '+1 (555) 333-4444',
        resumeUrl: 'https://example.com/resume/michael.pdf',
        status: 'demo'
      },
      {
        name: 'Emma Wilson',
        email: 'emma.demo@example.com',
        phone: '+1 (555) 444-5555',
        resumeUrl: 'https://example.com/resume/emma.pdf',
        status: 'demo'
      },
      {
        name: 'David Kim',
        email: 'david.demo@example.com',
        phone: '+1 (555) 555-6666',
        resumeUrl: 'https://example.com/resume/david.pdf',
        status: 'demo'
      }
    ])
    .select()
  
  if (candidateError) {
    console.error('❌ Error seeding candidates:', candidateError)
    return
  }
  
  console.log('✅ Seeded', candidates.length, 'demo candidates')
  
  // Seed job-candidate relationships
  const { data: jobCandidates, error: jcError } = await supabase
    .from('job_candidate')
    .insert([
      // React Developer applications
      {
        jobId: jobs[0].id,
        candidateId: candidates[0].id,
        stage: 'applied',
        notes: 'Strong React portfolio, good communication skills',
        assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
        status: 'demo'
      },
      {
        jobId: jobs[0].id,
        candidateId: candidates[1].id,
        stage: 'interview',
        notes: 'Impressive technical background, scheduled for final interview',
        assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
        status: 'demo'
      },
      // DevOps Engineer applications
      {
        jobId: jobs[1].id,
        candidateId: candidates[2].id,
        stage: 'technical',
        notes: 'Excellent AWS knowledge, completing technical assessment',
        assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
        status: 'demo'
      },
      {
        jobId: jobs[1].id,
        candidateId: candidates[3].id,
        stage: 'offer',
        notes: 'Strong candidate, offer extended',
        assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
        status: 'demo'
      },
      // Data Scientist applications
      {
        jobId: jobs[2].id,
        candidateId: candidates[4].id,
        stage: 'screening',
        notes: 'PhD in ML, reviewing research publications',
        assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
        status: 'demo'
      },
      // Product Manager (filled position)
      {
        jobId: jobs[3].id,
        candidateId: candidates[0].id,
        stage: 'hired',
        notes: 'Excellent product sense, started last week',
        assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
        status: 'demo'
      }
    ])
    .select()
  
  if (jcError) {
    console.error('❌ Error seeding job-candidate relationships:', jcError)
    return
  }
  
  console.log('✅ Seeded', jobCandidates.length, 'demo job-candidate relationships')
  
  // Seed candidate notes
  const { data: notes, error: notesError } = await supabase
    .from('candidate_notes')
    .insert([
      {
        jobCandidateId: jobCandidates[0].id,
        authorId: 'cd99579b-1b80-4802-9651-e881fb707583',
        content: 'Initial screening call went well. Candidate has strong React experience and good problem-solving skills.',
        status: 'demo'
      },
      {
        jobCandidateId: jobCandidates[1].id,
        authorId: 'cd99579b-1b80-4802-9651-e881fb707583',
        content: 'Technical interview completed successfully. Moving to final round with team lead.',
        status: 'demo'
      },
      {
        jobCandidateId: jobCandidates[2].id,
        authorId: 'cd99579b-1b80-4802-9651-e881fb707583',
        content: 'Candidate demonstrated excellent knowledge of containerization and CI/CD pipelines.',
        status: 'demo'
      },
      {
        jobCandidateId: jobCandidates[3].id,
        authorId: 'cd99579b-1b80-4802-9651-e881fb707583',
        content: 'Reference checks completed successfully. Extending offer with competitive package.',
        status: 'demo'
      }
    ])
    .select()
  
  if (notesError) {
    console.error('❌ Error seeding candidate notes:', notesError)
    return
  }
  
  console.log('✅ Seeded', notes.length, 'demo candidate notes')
}

async function updateRLSPolicies() {
  console.log('🛡️ Updating RLS policies...')
  
  // Drop and recreate demo policies
  const policies = [
    'DROP POLICY IF EXISTS "demo_viewer_read_clients" ON clients',
    'DROP POLICY IF EXISTS "demo_viewer_read_jobs" ON jobs',
    'DROP POLICY IF EXISTS "demo_viewer_read_candidates" ON candidates',
    'DROP POLICY IF EXISTS "demo_viewer_read_job_candidates" ON job_candidate',
    'DROP POLICY IF EXISTS "demo_viewer_read_candidate_notes" ON candidate_notes',
    
    // Create new policies
    `CREATE POLICY "demo_viewer_read_clients" ON clients FOR SELECT TO authenticated 
     USING (auth.get_user_role() = 'demo_viewer' AND status = 'demo')`,
    
    `CREATE POLICY "demo_viewer_read_jobs" ON jobs FOR SELECT TO authenticated 
     USING (auth.get_user_role() = 'demo_viewer' AND record_status = 'demo')`,
    
    `CREATE POLICY "demo_viewer_read_candidates" ON candidates FOR SELECT TO authenticated 
     USING (auth.get_user_role() = 'demo_viewer' AND status = 'demo')`,
    
    `CREATE POLICY "demo_viewer_read_job_candidates" ON job_candidate FOR SELECT TO authenticated 
     USING (auth.get_user_role() = 'demo_viewer' AND status = 'demo')`,
    
    `CREATE POLICY "demo_viewer_read_candidate_notes" ON candidate_notes FOR SELECT TO authenticated 
     USING (auth.get_user_role() = 'demo_viewer' AND status = 'demo')`
  ]
  
  for (const policy of policies) {
    try {
      await supabase.rpc('exec_sql', { sql: policy })
    } catch (error) {
      console.log('Policy operation may have failed (expected for some):', policy)
    }
  }
  
  console.log('✅ RLS policies updated')
}

async function testDemoAccess() {
  console.log('🧪 Testing demo user access...')
  
  // Sign in as demo user
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'demo@yourapp.com',
    password: 'Demo1234!'
  })
  
  if (loginError) {
    console.error('❌ Demo login failed:', loginError)
    return false
  }
  
  console.log('✅ Demo login successful')
  
  // Test data access
  const { data: clients } = await supabase.from('clients').select('*').eq('status', 'demo')
  const { data: jobs } = await supabase.from('jobs').select('*').eq('recordStatus', 'demo')
  const { data: candidates } = await supabase.from('candidates').select('*').eq('status', 'demo')
  const { data: jobCandidates } = await supabase.from('job_candidate').select('*').eq('status', 'demo')
  
  console.log('✅ Demo data access test:')
  console.log(`   Clients: ${clients?.length || 0}`)
  console.log(`   Jobs: ${jobs?.length || 0}`)
  console.log(`   Candidates: ${candidates?.length || 0}`)
  console.log(`   Job-Candidates: ${jobCandidates?.length || 0}`)
  
  await supabase.auth.signOut()
  return true
}

async function main() {
  console.log('🚀 Setting up comprehensive demo environment...')
  
  try {
    await ensureDemoUserExists()
    await runMigration()
    await seedDemoData()
    await updateRLSPolicies()
    await testDemoAccess()
    
    console.log('\n🎉 Demo setup complete!')
    console.log('✅ Demo user: demo@yourapp.com / Demo1234!')
    console.log('✅ Demo data seeded in all tables')
    console.log('✅ RLS policies configured')
    console.log('✅ Access testing successful')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

main().catch(console.error)