import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BUCKET_NAME = 'meal-images';
const IMAGES_FOLDER = '/Users/kutayyesilalan/Downloads/Images Food';

// Use service role key for admin operations (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkBucketExists() {
  try {
    // Try to list files in the bucket to check if it exists
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 });

    if (error && error.message.includes('not found')) {
      console.error('✗ Bucket not found. Please create it manually in Supabase dashboard.');
      return false;
    }

    if (error) {
      console.error('✗ Error accessing bucket:', error.message);
      return false;
    }

    console.log('✓ Bucket exists:', BUCKET_NAME);
    return true;
  } catch (error) {
    console.error('Error checking bucket:', error);
    return false;
  }
}

async function uploadImage(filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: `image/${path.extname(fileName).slice(1)}`,
        upsert: true // Overwrite if exists
      });

    if (error) {
      console.error(`✗ Error uploading ${fileName}:`, error.message);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log(`✓ Uploaded: ${fileName}`);
    return publicUrl;
  } catch (error) {
    console.error(`✗ Error uploading ${fileName}:`, error.message);
    return null;
  }
}

async function uploadAllImages() {
  console.log('Starting image upload to Supabase Storage...\n');

  // Check if bucket exists
  const bucketReady = await checkBucketExists();
  if (!bucketReady) {
    console.error('Failed to find bucket. Exiting.');
    return;
  }

  // Check if images folder exists
  if (!fs.existsSync(IMAGES_FOLDER)) {
    console.error(`Images folder not found: ${IMAGES_FOLDER}`);
    console.log('Please create the folder and add your meal images, or update IMAGES_FOLDER path in this script.');
    return;
  }

  // Get all image files
  const files = fs.readdirSync(IMAGES_FOLDER).filter(file =>
    /\.(jpg|jpeg|png|webp|gif)$/i.test(file)
  );

  if (files.length === 0) {
    console.log('No image files found in:', IMAGES_FOLDER);
    return;
  }

  console.log(`Found ${files.length} images to upload\n`);

  const uploadedImages = [];

  // Upload each image
  for (const file of files) {
    const filePath = path.join(IMAGES_FOLDER, file);
    const publicUrl = await uploadImage(filePath, file);

    if (publicUrl) {
      uploadedImages.push({
        fileName: file,
        url: publicUrl
      });
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Upload Summary:');
  console.log('='.repeat(50));
  console.log(`Total images: ${files.length}`);
  console.log(`Successfully uploaded: ${uploadedImages.length}`);
  console.log(`Failed: ${files.length - uploadedImages.length}`);

  if (uploadedImages.length > 0) {
    console.log('\nUploaded image URLs:');
    uploadedImages.forEach(img => {
      console.log(`${img.fileName}: ${img.url}`);
    });
  }

  console.log('\n✓ Done! You can now update your meals table with these URLs.');
}

// Run the upload
uploadAllImages().catch(console.error);
