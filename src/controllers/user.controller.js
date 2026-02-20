import User from "../models/User.js";
import Order from "../models/Order.js";

// @desc    Get all users with pagination
// @route   GET /api/users
// @access  Admin
export const getUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.role && req.query.role !== 'all') {
      filter.role = req.query.role;
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get users
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get order counts
    const usersWithOrderCount = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ user: user._id });
        return {
          ...user.toObject(),
          orderCount,
          lastActive: user.lastLogin || user.createdAt
        };
      })
    );

    res.json({
      success: true,
      page,
      pages: Math.ceil(total / limit),
      total,
      limit,
      users: usersWithOrderCount
    });
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Get user's recent orders
    const recentOrders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id totalPrice status createdAt');

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        recentOrders,
        totalOrders: await Order.countDocuments({ user: user._id }),
        lastActive: user.lastLogin || user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Admin
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    const validRoles = ['user', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid role" 
      });
    }

    // Prevent changing last admin
    if (role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      const user = await User.findById(req.params.id);
      
      if (user && user.role === 'admin' && adminCount <= 1) {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot change the last admin's role" 
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.json({
      success: true,
      message: "User role updated successfully",
      user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Prevent deleting last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot delete the last admin" 
        });
      }
    }

    // Delete user's orders
    await Order.deleteMany({ user: user._id });
    await user.deleteOne();

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Admin
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    
    const roleStats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newUsers = await User.countDocuments({ createdAt: { $gte: lastWeek } });
    const activeToday = await User.countDocuments({ lastLogin: { $gte: today } });

    const roleCounts = { admin: 0, manager: 0, user: 0 };
    roleStats.forEach(stat => {
      if (stat._id === 'admin') roleCounts.admin = stat.count;
      if (stat._id === 'manager') roleCounts.manager = stat.count;
      if (stat._id === 'user') roleCounts.user = stat.count;
    });

    res.json({
      success: true,
      stats: {
        total: totalUsers,
        ...roleCounts,
        newThisWeek: newUsers,
        activeToday
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};