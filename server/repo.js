const prisma = require('./prisma')

const getUserByEmail = (email) => prisma.user.findUnique({ where: { email } })
const getUserById = (id) => prisma.user.findUnique({ where: { id } })
const createUser = (data) => prisma.user.create({ data })
const updateUserById = (id, data) => prisma.user.update({ where: { id }, data })
const deleteUserById = (id) => prisma.user.delete({ where: { id } })

const createGoal = (data) => prisma.goal.create({ data })
const getGoalsByUser = (userId) => prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
const getGoalById = (id) => prisma.goal.findUnique({ where: { id } })
const updateGoal = (id, data) => prisma.goal.update({ where: { id }, data })
const deleteGoal = (id) => prisma.goal.delete({ where: { id } })

const createMeal = (data) => prisma.meal.create({ data })
const getMealsByUser = (userId, take = 50) => prisma.meal.findMany({ where: { userId }, orderBy: { consumedAt: 'desc' }, take })
const getMealById = (id) => prisma.meal.findUnique({ where: { id } })
const updateMeal = (id, data) => prisma.meal.update({ where: { id }, data })
const deleteMeal = (id) => prisma.meal.delete({ where: { id } })

module.exports = {
  getUserByEmail,
  getUserById,
  createUser,
  updateUserById,
  deleteUserById,
  createGoal,
  getGoalsByUser,
  getGoalById,
  updateGoal,
  deleteGoal,
  createMeal,
  getMealsByUser,
  getMealById,
  updateMeal,
  deleteMeal
}
