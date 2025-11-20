import { supabaseAdmin } from '../config/supabase.js';

/**
 * Middleware to verify user is an admin
 * Must be used after authenticateSupabase middleware
 */
export const requireAdmin = async (req, res, next) => {
  try {
    // Get user from previous auth middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user is admin in profiles table using admin client to bypass RLS
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking admin status:', error);
      return res.status(500).json({ message: 'Error verifying admin status' });
    }

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Admin authentication failed' });
  }
};
