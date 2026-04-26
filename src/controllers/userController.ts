import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { UserService } from '../services/userService';
import { auditData } from '../middleware/auditLogger';

const userService = new UserService();

// Create user (admin-only)
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  auditData.create(req, 'users', user.id, true);
  res.status(201).json({ success: true, data: user });
});

// Get all users with pagination
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.getUsers(req);

  res.json({
    success: true,
    data: {
      users: result.users,
      pagination: result.pagination,
    },
  });
});

// Get user by ID (supports both UUID and regular IDs)
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await userService.getUserById(id);

    // Audit sensitive user data access
    auditData.access(req, 'users', id, true);

    res.json({
      success: true,
      data: {
        user: user,
      },
    });
  } catch (error) {
    // Audit failed access attempt
    auditData.access(req, 'users', id, false);
    throw error;
  }
});

// Update user (supports both UUID and regular IDs)
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const user = await userService.updateUser(id, updateData);
  auditData.update(req, 'users', id, true, updateData);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: user,
    },
  });
});

// Delete user (soft delete) - supports both UUID and regular IDs
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await userService.deleteUser(id);
  auditData.delete(req, 'users', id, true);

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});
