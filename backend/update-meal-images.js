import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Mapping of old image paths to new Supabase URLs
const imageMapping = {
  'images/mac-and-cheese.jpg': 'https://hgxalltvfribfhwvfddj.supabase.co/storage/v1/object/public/meal-images/mac-and-cheese.jpg',
  'images/margherita-pizza.jpg': 'https://hgxalltvfribfhwvfddj.supabase.co/storage/v1/object/public/meal-images/margherita-pizza.jpg',
  'images/caesar-salad.jpg': 'https://hgxalltvfribfhwvfddj.supabase.co/storage/v1/object/public/meal-images/caesar-salad.jpg',
  'images/chicken-burger.jpg': 'https://hgxalltvfribfhwvfddj.supabase.co/storage/v1/object/public/meal-images/grilled-chicken-sandwich.jpg',
  'images/veggie-burger.jpg': 'https://hgxalltvfribfhwvfddj.supabase.co/storage/v1/object/public/meal-images/vegan-buddha-bowl.jpg',
  'images/spaghetti-carbonara.jpg': 'https://hgxalltvfribfhwvfddj.supabase.co/storage/v1/object/public/meal-images/spaghetti-carbonara.jpg',
  'images/mushroom-risotto.jpg': 'https://hgxalltvfribfhwvfddj.supabase.co/storage/v1/object/public/meal-images/mushroom-risotto.jpg',
  'images/beef-tacos.jpg': 'https://hgxalltvfribfhwvfddj.supabase.co/storage/v1/object/public/meal-images/beef-tacos.jpg',
  'images/chicken-curry.jpg': 'https://hgxalltvfribfhwvfddj.supabase.co/storage/v1/object/public/meal-images/chicken-curry.jpg',
  'images/sushi-platter.jpg': 'https://hgxalltvfribfhwvfddj.supabase.co/storage/v1/object/public/meal-images/sushi-roll-platter.jpg',
};

async function updateMealImages() {
  console.log('Starting to update meal images in database...\n');

  // Get all meals
  const { data: meals, error: fetchError } = await supabase
    .from('meals')
    .select('*');

  if (fetchError) {
    console.error('Error fetching meals:', fetchError);
    return;
  }

  console.log(`Found ${meals.length} meals to update\n`);

  let updated = 0;
  let skipped = 0;

  for (const meal of meals) {
    const newImageUrl = imageMapping[meal.image];

    if (newImageUrl) {
      const { error: updateError } = await supabase
        .from('meals')
        .update({ image: newImageUrl })
        .eq('id', meal.id);

      if (updateError) {
        console.error(`✗ Error updating ${meal.name}:`, updateError.message);
      } else {
        console.log(`✓ Updated ${meal.name}`);
        updated++;
      }
    } else {
      console.log(`⚠ Skipped ${meal.name} - no mapping found for: ${meal.image}`);
      skipped++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Update Summary:');
  console.log('='.repeat(50));
  console.log(`Total meals: ${meals.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log('\n✓ Done! Your meal images should now display correctly.');
}

updateMealImages().catch(console.error);
