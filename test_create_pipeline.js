// Test script to create pipeline columns directly
import { storage } from './server/storage.js';

async function createPipelineColumns() {
  const orgId = '3eaf74e7-eda2-415a-a6ca-2556a9425ae2';
  
  const columns = [
    { name: 'Applied', position: 0, orgId },
    { name: 'Screening', position: 1, orgId },
    { name: 'Interview', position: 2, orgId },
    { name: 'Offer', position: 3, orgId },
    { name: 'Hired', position: 4, orgId }
  ];
  
  for (const column of columns) {
    try {
      const result = await storage.createPipelineColumn(column);
      console.log('Created column:', result);
    } catch (error) {
      console.log('Column creation error (might already exist):', error.message);
    }
  }
}

createPipelineColumns().then(() => {
  console.log('Pipeline columns creation completed');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});