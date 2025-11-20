import bodyParser from 'body-parser';
import express from 'express';
import dotenv from 'dotenv';
import { supabase, supabaseAdmin } from './config/supabase.js';
import { requireAdmin } from './middleware/adminAuth.js';

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

    // Get user profile using admin client to bypass RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('name, is_admin')
      .eq('id', data.user.id)
      .single();

    // DEBUG: Log profile data
    console.log('=== LOGIN DEBUG ===');
    console.log('User ID:', data.user.id);
    console.log('User Email:', data.user.email);
    console.log('Profile data:', profile);
    console.log('Profile error:', profileError);
    console.log('is_admin value:', profile?.is_admin);
    console.log('==================');

    res.json({
      message: 'Login successful',
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.email.split('@')[0],
        isAdmin: profile?.is_admin || false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/auth/verify', authenticateSupabase, async (req, res) => {
  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('name, is_admin')
      .eq('id', req.user.id)
      .single();

    // DEBUG: Log profile data
    console.log('=== VERIFY DEBUG ===');
    console.log('User ID:', req.user.id);
    console.log('User Email:', req.user.email);
    console.log('Profile data:', profile);
    console.log('Profile error:', profileError);
    console.log('is_admin value:', profile?.is_admin);
    console.log('==================');

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: profile?.name || req.user.email.split('@')[0],
        isAdmin: profile?.is_admin || false
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
// ADMIN ENDPOINTS
// ============================================

// Check if user is admin
app.get('/admin/check', authenticateSupabase, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', req.user.id)
      .single();

    res.json({ isAdmin: profile?.is_admin || false });
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Error checking admin status' });
  }
});

// ============================================
// ADMIN - MEALS MANAGEMENT
// ============================================

// Create new meal
app.post('/admin/meals', authenticateSupabase, requireAdmin, async (req, res) => {
  const { id, name, price, description, image, category } = req.body;

  if (!id || !name || !price || !category) {
    return res.status(400).json({ message: 'ID, name, price, and category are required' });
  }

  try {
    const { data, error } = await supabase
      .from('meals')
      .insert([{ id, name, price, description, image, category }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ message: 'Meal created successfully', meal: data });
  } catch (error) {
    console.error('Create meal error:', error);
    res.status(500).json({ message: 'Error creating meal' });
  }
});

// Update meal
app.put('/admin/meals/:id', authenticateSupabase, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, price, description, image, category } = req.body;

  try {
    const { data, error } = await supabase
      .from('meals')
      .update({ name, price, description, image, category })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    res.json({ message: 'Meal updated successfully', meal: data });
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({ message: 'Error updating meal' });
  }
});

// Delete meal
app.delete('/admin/meals/:id', authenticateSupabase, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({ message: 'Error deleting meal' });
  }
});

// ============================================
// ADMIN - ORDERS MANAGEMENT
// ============================================

// Get all orders (admin only)
app.get('/admin/orders', authenticateSupabase, requireAdmin, async (req, res) => {
  try {
    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
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

        // Calculate total
        const total = items.reduce((sum, item) =>
          sum + (parseFloat(item.meal_price) * item.quantity), 0
        );

        return {
          id: order.id,
          userId: order.user_id,
          status: order.status || 'pending',
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
          })),
          total: total.toFixed(2)
        };
      })
    );

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Update order status
app.put('/admin/orders/:id', authenticateSupabase, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
    });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully', order: data });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// ============================================
// ADMIN - USER MANAGEMENT
// ============================================

// Get all users
app.get('/admin/users', authenticateSupabase, requireAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, name, is_admin, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Get order count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        return {
          ...user,
          orderCount: count || 0
        };
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// ============================================
// ADMIN - ANALYTICS
// ============================================

// Get dashboard analytics
app.get('/admin/analytics', authenticateSupabase, requireAdmin, async (req, res) => {
  try {
    // Get total orders count
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Get total revenue
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('meal_price, quantity');

    const totalRevenue = orderItems.reduce((sum, item) =>
      sum + (parseFloat(item.meal_price) * item.quantity), 0
    );

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get orders by status
    const { data: orders } = await supabase
      .from('orders')
      .select('status');

    const ordersByStatus = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      delivering: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach(order => {
      const status = order.status || 'pending';
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
    });

    // Get popular meals (most ordered)
    const { data: allOrderItems } = await supabase
      .from('order_items')
      .select('meal_id, meal_name, meal_price, quantity');

    const mealStats = {};
    allOrderItems.forEach(item => {
      if (!mealStats[item.meal_id]) {
        mealStats[item.meal_id] = {
          id: item.meal_id,
          name: item.meal_name,
          price: item.meal_price,
          totalOrders: 0,
          totalQuantity: 0,
          revenue: 0
        };
      }
      mealStats[item.meal_id].totalOrders += 1;
      mealStats[item.meal_id].totalQuantity += item.quantity;
      mealStats[item.meal_id].revenue += parseFloat(item.meal_price) * item.quantity;
    });

    const popularMeals = Object.values(mealStats)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, customer_name, customer_email, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      totalOrders: totalOrders || 0,
      totalRevenue: totalRevenue.toFixed(2),
      totalUsers: totalUsers || 0,
      ordersByStatus,
      popularMeals,
      recentOrders
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
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
