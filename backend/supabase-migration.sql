-- ============================================
-- Supabase Database Schema for Food Order App
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Profiles table (extends Supabase Auth users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meals table
CREATE TABLE meals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  image TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_street TEXT NOT NULL,
  customer_postal_code TEXT NOT NULL,
  customer_city TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table (normalized structure)
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders ON DELETE CASCADE NOT NULL,
  meal_id TEXT NOT NULL,
  meal_name TEXT NOT NULL,
  meal_price DECIMAL(10, 2) NOT NULL,
  meal_description TEXT,
  meal_image TEXT,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Meals policies (public read)
CREATE POLICY "Anyone can view meals"
  ON meals FOR SELECT
  TO authenticated, anon
  USING (true);

-- Admin can manage meals (you can add admin users later)
CREATE POLICY "Service role can manage meals"
  ON meals FOR ALL
  USING (auth.role() = 'service_role');

-- Orders policies
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- SEED DATA - Insert Meals
-- ============================================

INSERT INTO meals (id, name, price, description, image, category) VALUES
('m1', 'Mac & Cheese', 8.99, 'Creamy cheddar cheese mixed with perfectly cooked macaroni, topped with crispy breadcrumbs. A classic comfort food.', 'images/mac-and-cheese.jpg', 'pasta'),
('m2', 'Margherita Pizza', 12.99, 'A classic pizza with fresh mozzarella, tomatoes, and basil on a thin and crispy crust.', 'images/margherita-pizza.jpg', 'pizza'),
('m3', 'Caesar Salad', 7.99, 'Romaine lettuce tossed in Caesar dressing, topped with croutons and parmesan shavings.', 'images/caesar-salad.jpg', 'salad'),
('m4', 'Chicken Burger', 11.99, 'A succulent chicken breast burger served on a sesame seed bun with lettuce, tomato, and mayo.', 'images/chicken-burger.jpg', 'burger'),
('m5', 'Veggie Burger', 9.99, 'A juicy veggie patty served on a whole grain bun with lettuce, tomato, and a tangy sauce.', 'images/veggie-burger.jpg', 'burger'),
('m6', 'Spaghetti Carbonara', 14.99, 'Al dente spaghetti with a creamy sauce made from egg yolk, pecorino cheese, and pancetta.', 'images/spaghetti-carbonara.jpg', 'pasta'),
('m7', 'BBQ Ribs', 18.99, 'Tender pork ribs smothered in tangy BBQ sauce, served with coleslaw and fries.', 'images/bbq-ribs.jpg', 'other'),
('m8', 'Grilled Salmon', 16.99, 'Fresh salmon fillet grilled to perfection, served with a side of steamed vegetables and rice.', 'images/grilled-salmon.jpg', 'seafood'),
('m9', 'Chocolate Cake', 6.99, 'Rich and moist chocolate cake layered with velvety chocolate frosting.', 'images/chocolate-cake.jpg', 'dessert'),
('m10', 'Greek Salad', 8.99, 'A refreshing mix of tomatoes, cucumbers, olives, and feta cheese drizzled with olive oil.', 'images/greek-salad.jpg', 'salad'),
('m11', 'Hawaiian Pizza', 13.99, 'A tropical twist on pizza with ham, pineapple, and melted cheese on a crispy crust.', 'images/hawaiian-pizza.jpg', 'pizza'),
('m12', 'Fish Tacos', 12.99, 'Soft tortillas filled with grilled fish, topped with cabbage slaw and a zesty lime crema.', 'images/fish-tacos.jpg', 'seafood'),
('m13', 'Tiramisu', 7.99, 'An Italian dessert made of ladyfingers dipped in coffee, layered with mascarpone cheese and dusted with cocoa.', 'images/tiramisu.jpg', 'dessert'),
('m14', 'Beef Tacos', 10.99, 'Three soft tortillas filled with seasoned beef, topped with fresh salsa, cheese, and sour cream.', 'images/beef-tacos.jpg', 'other'),
('m15', 'Shrimp Scampi', 15.99, 'Juicy shrimp sautéed in a garlic butter sauce, served over a bed of linguine.', 'images/shrimp-scampi.jpg', 'seafood'),
('m16', 'Lobster Bisque', 14.99, 'A creamy soup made from lobster stock, aromatic vegetables, and a touch of brandy.', 'images/lobster-bisque.jpg', 'seafood'),
('m17', 'Mushroom Risotto', 13.99, 'Creamy Arborio rice cooked with a medley of wild mushrooms and finished with parmesan.', 'images/mushroom-risotto.jpg', 'other');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
