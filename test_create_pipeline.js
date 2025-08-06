// Direct database insertion for pipeline columns
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPipelineColumns() {
  const orgId = '3eaf74e7-eda2-415a-a6ca-2556a9425ae2';
  
  const columns = [
    { title: 'Applied', position: 0, org_id: orgId },
    { title: 'Screening', position: 1, org_id: orgId },
    { title: 'Interview', position: 2, org_id: orgId },
    { title: 'Offer', position: 3, org_id: orgId },
    { title: 'Hired', position: 4, org_id: orgId }
  ];
  
  for (const column of columns) {
    try {
      const { data, error } = await supabase
        .from('pipeline_columns')
        .insert(column)
        .select()
        .single();
      
      if (error) {
        console.log('Column creation error:', error.message);
      } else {
        console.log('Created column:', data);
      }
    } catch (error) {
      console.log('Exception:', error.message);
    }
  }
  
  // Verify columns exist
  const { data: allColumns, error } = await supabase
    .from('pipeline_columns')
    .select('*')
    .eq('org_id', orgId);
    
  if (error) {
    console.error('Error fetching columns:', error);
  } else {
    console.log('All pipeline columns:', allColumns);
  }
}

createPipelineColumns().then(() => {
  console.log('Pipeline columns creation completed');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});