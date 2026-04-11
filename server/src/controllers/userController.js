import User from '../models/User.js';

export async function listUsersForAssignment(req, res, next) {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
      .select('email name')
      .sort({ email: 1 })
      .lean();
    res.json(users.map((u) => ({ id: u._id, email: u.email, name: u.name })));
  } catch (e) {
    next(e);
  }
}
