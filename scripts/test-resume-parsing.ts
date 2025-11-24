/**
 * Test Script: Manually trigger resume parsing on existing candidates
 * 
 * Usage: npx tsx scripts/test-resume-parsing.ts
 */

import { createClient } from '@supabase/supabase-js';
import { storage } from '../server/storage/index';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testResumeParsing() {
  try {
    console.log('🔍 Finding candidates with resumes...\n');

    // Query candidates with resumes that haven't been parsed yet
    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('id, name, email, resume_url, parsing_status, org_id')
      .not('resume_url', 'is', null)
      .limit(5);

    if (error) {
      console.error('❌ Error fetching candidates:', error);
      return;
    }

    if (!candidates || candidates.length === 0) {
      console.log('⚠️  No candidates with resumes found');
      return;
    }

    console.log(`Found ${candidates.length} candidates with resumes:\n`);
    candidates.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.name} (${c.email})`);
      console.log(`   ID: ${c.id}`);
      console.log(`   Resume: ${c.resume_url}`);
      console.log(`   Status: ${c.parsing_status || 'not parsed'}\n`);
    });

    // Pick the first candidate to test
    const testCandidate = candidates[0];
    console.log(`\n🧪 Testing parsing on: ${testCandidate.name}\n`);
    console.log('━'.repeat(60));

    // Trigger parsing
    console.log(`\n⏳ Starting resume parsing...`);
    const startTime = Date.now();

    try {
      const result = await storage.candidates.parseAndUpdateCandidateFromStorage(
        testCandidate.id,
        testCandidate.resume_url
      );

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n✅ Parsing completed in ${duration}s\n`);
      console.log('━'.repeat(60));
      console.log('\n📊 Parsed Data:\n');

      console.log('Name:', result.name);
      console.log('Email:', result.email);
      console.log('Phone:', result.phone || 'N/A');
      console.log('LinkedIn:', result.linkedinUrl || 'N/A');
      console.log('Portfolio:', result.portfolioUrl || 'N/A');
      
      console.log('\n📝 Summary:');
      console.log(result.summary || 'N/A');
      
      console.log('\n🎯 Experience Level:', result.experienceLevel || 'N/A');
      console.log('💼 Total Years:', result.totalYearsExperience || 'N/A');
      
      console.log('\n🛠️  Skills (' + (result.skills?.length || 0) + '):');
      if (result.skills && result.skills.length > 0) {
        console.log(result.skills.join(', '));
      }

      console.log('\n🌐 Languages (' + (result.languages?.length || 0) + '):');
      if (result.languages && result.languages.length > 0) {
        console.log(result.languages.join(', '));
      }

      console.log('\n🏆 Certifications (' + (result.certifications?.length || 0) + '):');
      if (result.certifications && result.certifications.length > 0) {
        console.log(result.certifications.join(', '));
      }

      // Parse work experience from JSONB string
      if (result.workExperience) {
        try {
          const experiences = typeof result.workExperience === 'string' 
            ? JSON.parse(result.workExperience)
            : result.workExperience;
          
          console.log(`\n💼 Work Experience (${experiences.length}):`);
          experiences.forEach((exp: any, idx: number) => {
            console.log(`\n  ${idx + 1}. ${exp.title} at ${exp.company}`);
            console.log(`     Duration: ${exp.duration || 'N/A'}`);
            if (exp.location) console.log(`     Location: ${exp.location}`);
            if (exp.description) console.log(`     Description: ${exp.description}`);
            if (exp.achievements && exp.achievements.length > 0) {
              console.log(`     Achievements:`);
              exp.achievements.forEach((a: string) => console.log(`       • ${a}`));
            }
          });
        } catch (e) {
          console.log('  (Error parsing work experience JSON)');
        }
      }

      // Parse projects from JSONB string
      if (result.projects) {
        try {
          const projects = typeof result.projects === 'string'
            ? JSON.parse(result.projects)
            : result.projects;
          
          console.log(`\n🚀 Projects (${projects.length}):`);
          projects.forEach((proj: any, idx: number) => {
            console.log(`\n  ${idx + 1}. ${proj.name}`);
            if (proj.description) console.log(`     ${proj.description}`);
            if (proj.technologies && proj.technologies.length > 0) {
              console.log(`     Tech: ${proj.technologies.join(', ')}`);
            }
          });
        } catch (e) {
          console.log('  (Error parsing projects JSON)');
        }
      }

      // Parse education
      if (result.education) {
        try {
          const education = typeof result.education === 'string'
            ? JSON.parse(result.education)
            : result.education;
          
          console.log(`\n🎓 Education (${education.length}):`);
          education.forEach((edu: any, idx: number) => {
            console.log(`  ${idx + 1}. ${edu.degree || 'N/A'} - ${edu.institution || 'N/A'}`);
            if (edu.graduationYear) console.log(`     Graduated: ${edu.graduationYear}`);
          });
        } catch (e) {
          console.log('  (Error parsing education JSON)');
        }
      }

      console.log('\n━'.repeat(60));
      console.log('\n✅ Test completed successfully!\n');

    } catch (parseError) {
      console.error('\n❌ Parsing failed:', parseError);
      
      // Check the parsing error in database
      const { data: errorData } = await supabase
        .from('candidates')
        .select('parsing_status, parsing_error')
        .eq('id', testCandidate.id)
        .single();
      
      if (errorData) {
        console.log('\n📊 Database status:');
        console.log('Status:', errorData.parsing_status);
        console.log('Error:', errorData.parsing_error);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testResumeParsing()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
