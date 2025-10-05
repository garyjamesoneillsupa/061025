import express from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { storage } from '../storage';
import { 
  AuthService, 
  rateLimitLogin, 
  recordLoginAttempt, 
  authenticateToken,
  requireAdmin,
  AuthRequest 
} from '../middleware/auth';

const router = express.Router();

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().optional(),
  pin: z.string().optional(),
}).refine(data => data.password || data.pin, {
  message: "Either password or PIN is required",
  path: ["password"]
});

const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'driver']),
  driverId: z.string().optional(), // For linking to existing driver record
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Login endpoint
router.post('/login', rateLimitLogin, async (req, res) => {
  try {
    const { username, password, pin } = loginSchema.parse(req.body);
    
    // First try driver PIN login if PIN is provided
    if (pin) {
      const driver = await storage.getDriverByUsernameAndPin(username, pin);
      if (driver && driver.isActive) {
        // Generate JWT token for driver
        const user = {
          id: driver.id,
          username: driver.username || driver.name,
          role: 'driver' as const,
          isActive: driver.isActive,
          driverId: driver.id,
        };
        
        const token = AuthService.generateToken(user);
        recordLoginAttempt(req, true);
        
        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            driverId: user.driverId,
          },
        });
      }
    }
    
    // Fall back to user credentials system for admin/password users
    if (password) {
      const userCredentials = await storage.getUserCredentials(username);
      
      if (!userCredentials) {
        recordLoginAttempt(req, false);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Verify password
      const isPasswordValid = await AuthService.verifyPassword(password, userCredentials.hashedPassword);
      
      if (!isPasswordValid) {
        recordLoginAttempt(req, false);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check if user is active
      if (!userCredentials.isActive) {
        recordLoginAttempt(req, false);
        return res.status(401).json({ message: 'Account is disabled' });
      }
      
      // Generate JWT token
      const user = {
        id: userCredentials.id,
        username: userCredentials.username,
        role: userCredentials.role as 'admin' | 'driver',
        isActive: userCredentials.isActive,
      };
      
      const token = AuthService.generateToken(user);
      
      // Record successful login
      recordLoginAttempt(req, true);
      await storage.recordUserLogin(userCredentials.id, req.ip || 'unknown');
      
      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          driverId: userCredentials.driverId,
        },
      });
    }
    
    recordLoginAttempt(req, false);
    return res.status(401).json({ message: 'Invalid credentials' });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userDetails = await storage.getUserCredentials(req.user.username);
    
    if (!userDetails) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: userDetails.id,
      username: userDetails.username,
      role: userDetails.role,
      isActive: userDetails.isActive,
      driverId: userDetails.driverId,
      lastLogin: userDetails.lastLogin,
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user information' });
  }
});

// Create new user (admin only)
router.post('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userData = createUserSchema.parse(req.body);
    
    // Check if username already exists
    const existingUser = await storage.getUserCredentials(userData.username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = await AuthService.hashPassword(userData.password);
    
    // Create user  
    const newUser = await storage.createUserCredentials({
      id: crypto.randomUUID(),
      username: userData.username,
      hashedPassword,
      role: userData.role,
      driverId: userData.driverId || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        isActive: newUser.isActive,
        driverId: newUser.driverId,
      },
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Get current user credentials
    const userCredentials = await storage.getUserCredentials(req.user.username);
    if (!userCredentials) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await AuthService.verifyPassword(
      currentPassword, 
      userCredentials.hashedPassword
    );
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedNewPassword = await AuthService.hashPassword(newPassword);
    
    // Update password
    await storage.updateUserPassword(userCredentials.id, hashedNewPassword);
    
    res.json({ message: 'Password changed successfully' });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const users = await storage.getAllUsers();
    
    // Remove sensitive information
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      driverId: user.driverId,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    }));
    
    res.json(safeUsers);
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// Update user status (admin only)
router.patch('/users/:userId/status', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }
    
    await storage.updateUserStatus(userId, isActive);
    
    res.json({ message: 'User status updated successfully' });
    
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Generate secure password (admin only)
router.post('/generate-password', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { length = 12 } = req.body;
    
    if (length < 8 || length > 50) {
      return res.status(400).json({ message: 'Password length must be between 8 and 50 characters' });
    }
    
    const password = AuthService.generateSecurePassword(length);
    
    res.json({ password });
    
  } catch (error) {
    console.error('Generate password error:', error);
    res.status(500).json({ message: 'Failed to generate password' });
  }
});

// Logout (token blacklisting would require Redis/database implementation)
router.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // In a production system, you would blacklist the token here
    // For now, we'll just return success and rely on client-side token removal
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// Driver-specific login endpoint for mobile app
router.post('/driver-login', rateLimitLogin, async (req, res) => {
  try {
    const { username, pin } = req.body;

    if (!username || !pin) {
      return res.status(400).json({ 
        message: 'Username and PIN are required' 
      });
    }

    // Find driver by credentials
    const driver = await storage.getDriverByCredentials(username, pin);

    if (!driver) {
      recordLoginAttempt(req, false);
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    if (!driver.isActive) {
      recordLoginAttempt(req, false);
      return res.status(401).json({ 
        message: 'Driver account is inactive' 
      });
    }

    recordLoginAttempt(req, true);

    // Generate JWT token for driver
    const user = {
      id: driver.id,
      username: driver.username || driver.name,
      name: driver.name, // Include full name
      role: 'driver' as const,
      isActive: driver.isActive,
      driverId: driver.id,
    };
    
    const token = AuthService.generateToken(user);

    // Return token and user info (matching /api/auth/login format)
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name, // Include full name in response
        role: user.role,
        driverId: user.driverId,
      },
    });

  } catch (error) {
    console.error('Driver login error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

export default router;