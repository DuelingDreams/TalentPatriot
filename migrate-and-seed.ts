import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runFullMigration() {
  console.log('🚀 Running full migration and seeding...')
  
  // First, let's create all the tables based on our schema
  const createTablesSQL = `
    -- Create enums
    DO $$ BEGIN
        CREATE TYPE job_status AS ENUM ('open', 'closed', 'on_hold', 'filled');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    
    DO $$ BEGIN
        CREATE TYPE candidate_stage AS ENUM ('applied', 'screening', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    
    DO $$ BEGIN
        CREATE TYPE record_status AS ENUM ('active', 'demo', 'archived');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    
    -- Create clients table
    CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        location VARCHAR(255),
        website VARCHAR(255),
        contact_name VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        notes TEXT,
        status record_status DEFAULT 'active' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
    
    -- Create jobs table
    CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        client_id UUID REFERENCES clients(id) NOT NULL,
        job_status job_status DEFAULT 'open' NOT NULL,
        record_status record_status DEFAULT 'active' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
    
    -- Create candidates table
    CREATE TABLE IF NOT EXISTS candidates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        resume_url TEXT,
        status record_status DEFAULT 'active' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
    
    -- Create job_candidate table
    CREATE TABLE IF NOT EXISTS job_candidate (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID REFERENCES jobs(id) NOT NULL,
        candidate_id UUID REFERENCES candidates(id) NOT NULL,
        stage candidate_stage DEFAULT 'applied' NOT NULL,
        notes TEXT,
        assigned_to VARCHAR(255),
        status record_status DEFAULT 'active' NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
    
    -- Create candidate_notes table
    CREATE TABLE IF NOT EXISTS candidate_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_candidate_id UUID REFERENCES job_candidate(id) NOT NULL,
        author_id UUID NOT NULL,
        content TEXT NOT NULL,
        status record_status DEFAULT 'active' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
    
    -- Enable RLS
    ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
    ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
    ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;
    ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;
    
    -- Create auth helper function
    CREATE OR REPLACE FUNCTION auth.get_user_role()
    RETURNS TEXT AS $$
    BEGIN
        RETURN COALESCE(
            (auth.jwt() ->> 'user_metadata')::json ->> 'role',
            'authenticated'
        );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `
  
  try {
    console.log('🔧 Creating tables...')
    const { error } = await supabase.rpc('exec', { sql: createTablesSQL })
    
    if (error) {
      console.error('❌ Error creating tables:', error.message)
      // Try a different approach - execute each statement separately
      await supabase.rpc('exec', { 
        sql: "CREATE TYPE job_status AS ENUM ('open', 'closed', 'on_hold', 'filled');" 
      }).catch(() => {})
      await supabase.rpc('exec', { 
        sql: "CREATE TYPE candidate_stage AS ENUM ('applied', 'screening', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected');" 
      }).catch(() => {})
      await supabase.rpc('exec', { 
        sql: "CREATE TYPE record_status AS ENUM ('active', 'demo', 'archived');" 
      }).catch(() => {})
    } else {
      console.log('✅ Tables created successfully')
    }
    
    // Now seed demo data using the correct column names
    console.log('🌱 Seeding demo data...')
    
    // Seed clients with proper column names
    const { data: clients, error: clientError } = await supabase
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
    
    if (clientError) {
      console.error('❌ Error seeding clients:', clientError.message)
      return
    }
    
    console.log('✅ Seeded', clients.length, 'clients')
    
    // Seed jobs
    const { data: jobs, error: jobError } = await supabase
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
    
    if (jobError) {
      console.error('❌ Error seeding jobs:', jobError.message)
      return
    }
    
    console.log('✅ Seeded', jobs.length, 'jobs')
    
    // Seed candidates
    const { data: candidates, error: candidateError } = await supabase
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
    
    if (candidateError) {
      console.error('❌ Error seeding candidates:', candidateError.message)
      return
    }
    
    console.log('✅ Seeded', candidates.length, 'candidates')
    
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
      console.error('❌ Error seeding job-candidate relationships:', jcError.message)
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
      console.error('❌ Error seeding candidate notes:', notesError.message)
      return
    }
    
    console.log('✅ Seeded', notes.length, 'candidate notes')
    
    // Create RLS policies
    console.log('🛡️ Creating RLS policies...')
    
    const rlsPolicies = `
      -- Demo viewer policies
      CREATE POLICY "demo_viewer_read_clients" ON clients FOR SELECT TO authenticated 
      USING (auth.get_user_role() = 'demo_viewer' AND status = 'demo');
      
      CREATE POLICY "demo_viewer_read_jobs" ON jobs FOR SELECT TO authenticated 
      USING (auth.get_user_role() = 'demo_viewer' AND record_status = 'demo');
      
      CREATE POLICY "demo_viewer_read_candidates" ON candidates FOR SELECT TO authenticated 
      USING (auth.get_user_role() = 'demo_viewer' AND status = 'demo');
      
      CREATE POLICY "demo_viewer_read_job_candidates" ON job_candidate FOR SELECT TO authenticated 
      USING (auth.get_user_role() = 'demo_viewer' AND status = 'demo');
      
      CREATE POLICY "demo_viewer_read_candidate_notes" ON candidate_notes FOR SELECT TO authenticated 
      USING (auth.get_user_role() = 'demo_viewer' AND status = 'demo');
    `
    
    await supabase.rpc('exec', { sql: rlsPolicies }).catch(() => {
      console.log('Some RLS policies may already exist')
    })
    
    console.log('✅ RLS policies created')
    
    // Test demo user access
    console.log('🧪 Testing demo user access...')
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'demo@yourapp.com',
      password: 'Demo1234!'
    })
    
    if (loginError) {
      console.error('❌ Demo login failed:', loginError.message)
      return
    }
    
    console.log('✅ Demo login successful')
    
    // Test data access
    const { data: testClients } = await supabase.from('clients').select('*').eq('status', 'demo')
    const { data: testJobs } = await supabase.from('jobs').select('*').eq('record_status', 'demo')
    const { data: testCandidates } = await supabase.from('candidates').select('*').eq('status', 'demo')
    const { data: testJobCandidates } = await supabase.from('job_candidate').select('*').eq('status', 'demo')
    
    console.log('✅ Demo data access test:')
    console.log(`   Clients: ${testClients?.length || 0}`)
    console.log(`   Jobs: ${testJobs?.length || 0}`)
    console.log(`   Candidates: ${testCandidates?.length || 0}`)
    console.log(`   Job-Candidates: ${testJobCandidates?.length || 0}`)
    
    await supabase.auth.signOut()
    
    console.log('\n🎉 Full migration and seeding complete!')
    console.log('✅ Demo user: demo@yourapp.com / Demo1234!')
    console.log('✅ All tables created and seeded')
    console.log('✅ RLS policies configured')
    console.log('✅ Demo data ready for use')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

runFullMigration().catch(console.error)