import { supabase } from './config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('Checking meal-images bucket...\n');

const { data: files, error } = await supabase.storage
  .from('meal-images')
  .list('', {
    limit: 100,
    sortBy: { column: 'name', order: 'asc' }
  });

if (error) {
  console.error('Error listing files:', error);
} else {
  console.log(`Files in meal-images bucket: ${files.length}\n`);

  if (files.length > 0) {
    files.forEach(file => {
      const { data: { publicUrl } } = supabase.storage
        .from('meal-images')
        .getPublicUrl(file.name);
      console.log(`File: ${file.name}`);
      console.log(`URL: ${publicUrl}\n`);
    });
  } else {
    console.log('No files found in the bucket.');
  }
}
