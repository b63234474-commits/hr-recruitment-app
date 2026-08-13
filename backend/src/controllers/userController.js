import User, { USER_ROLES } from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  if (!firstName || !lastName || !email || !password || !role) {
    throw new ApiError(
      400,
      'First name, last name, email, password, and role are required'
    );
  }

  if (!USER_ROLES.includes(role)) {
    throw new ApiError(400, `Invalid role. Allowed roles: ${USER_ROLES.join(', ')}`);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user },
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: { users },
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, role, isActive } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (role !== undefined) {
    if (!USER_ROLES.includes(role)) {
      throw new ApiError(400, `Invalid role. Allowed roles: ${USER_ROLES.join(', ')}`);
    }
    user.role = role;
  }
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: { user },
  });
});
