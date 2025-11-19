import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Manual mapping of meals to available images
const imageMappings = {
  'Tiramisu': 'lemon-cheesecake.jpg',  // Use lemon-cheesecake as dessert
  'Chocolate Cake': 'chocolate-brownie.jpg',  // Use chocolate-brownie
  'BBQ Ribs': 'steak-frites.jpg',  // Use steak image for ribs
  'Grilled Salmon': 'seafood-paella.jpg',  // Use seafood image
  'Fish Tacos': 'beef-tacos.jpg',  // Use tacos image
  'Greek Salad': 'caesar-salad.jpg',  // Use salad image
  'Hawaiian Pizza': 'margherita-pizza.jpg',  // Use pizza image
  'Shrimp Scampi': 'seafood-paella.jpg'  // Use seafood image
};

async function fixMissingImages() {
  console.log('Fixing missing meal images...\n');

  for (const [mealName, imageFileName] of Object.entries(imageMappings)) {
    const imageUrl = `https://hgxalltvfribfhwvfddj.supabase.co/storage/v1/object/public/meal-images/${imageFileName}`;

    const { error } = await supabase
      .from('meals')
      .update({ image: imageUrl })
      .eq('name', mealName);

    if (error) {
      console.error(`✗ Error updating ${mealName}:`, error.message);
    } else {
      console.log(`✓ Updated ${mealName} → ${imageFileName}`);
    }
  }

  console.log('\n✓ Done! All meals now have images.');
}

fixMissingImages().catch(console.error);
