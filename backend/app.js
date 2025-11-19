import bodyParser from 'body-parser';
import express from 'express';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Middleware to verify Supabase JWT token
const authenticateSupabase = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

app.post('/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // Create profile in profiles table (handled by trigger, but we can also do it manually)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          email: data.user.email,
          name: name
        }
      ]);

    if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
      console.error('Profile creation error:', profileError);
    }

    res.status(201).json({
      message: 'User created successfully',
      token: data.session?.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: name
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', data.user.id)
      .single();

    res.json({
      message: 'Login successful',
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.email.split('@')[0]
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/auth/verify', authenticateSupabase, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', req.user.id)
      .single();

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: profile?.name || req.user.email.split('@')[0]
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// ============================================
// MEALS ENDPOINTS
// ============================================

app.get('/meals', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({ message: 'Error fetching meals' });
  }
});

// ============================================
// ORDERS ENDPOINTS
// ============================================

app.post('/orders', authenticateSupabase, async (req, res) => {
  const orderData = req.body.order;

  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return res.status(400).json({ message: 'Missing data.' });
  }

  if (
    !orderData.customer.email ||
    !orderData.customer.email.includes('@') ||
    !orderData.customer.name ||
    orderData.customer.name.trim() === '' ||
    !orderData.customer.street ||
    orderData.customer.street.trim() === '' ||
    !orderData.customer['postal-code'] ||
    orderData.customer['postal-code'].trim() === '' ||
    !orderData.customer.city ||
    orderData.customer.city.trim() === ''
  ) {
    return res.status(400).json({
      message: 'Missing data: Email, name, street, postal code or city is missing.',
    });
  }

  try {
    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: req.user.id,
          customer_name: orderData.customer.name,
          customer_email: orderData.customer.email,
          customer_street: orderData.customer.street,
          customer_postal_code: orderData.customer['postal-code'],
          customer_city: orderData.customer.city
        }
      ])
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Insert order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      meal_id: item.id,
      meal_name: item.name,
      meal_price: parseFloat(item.price),
      meal_description: item.description,
      meal_image: item.image,
      quantity: item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw itemsError;
    }

    res.status(201).json({ message: 'Order created!' });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
});

app.get('/orders', authenticateSupabase, async (req, res) => {
  try {
    // Get user's orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (itemsError) {
          throw itemsError;
        }

        // Format to match the old structure
        return {
          id: order.id,
          userId: order.user_id,
          createdAt: order.created_at,
          customer: {
            name: order.customer_name,
            email: order.customer_email,
            street: order.customer_street,
            'postal-code': order.customer_postal_code,
            city: order.customer_city
          },
          items: items.map(item => ({
            id: item.meal_id,
            name: item.meal_name,
            price: item.meal_price.toString(),
            description: item.meal_description,
            image: item.meal_image,
            quantity: item.quantity
          }))
        };
      })
    );

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  res.status(404).json({ message: 'Not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Connected to Supabase: ${process.env.SUPABASE_URL}`);
});
