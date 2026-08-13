import User from '../models/User.js';
import env from '../config/env.js';

const seedAdmin = async () => {
  const userCount = await User.countDocuments();

  if (userCount > 0) {
    return;
  }

  await User.create({
    firstName: 'System',
    lastName: 'Admin',
    email: env.adminEmail,
    password: env.adminPassword,
    role: 'Admin',
  });

  console.log(`Default admin user created: ${env.adminEmail}`);
};

export default seedAdmin;
