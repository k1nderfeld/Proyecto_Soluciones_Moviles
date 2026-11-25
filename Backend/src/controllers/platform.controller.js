// Consistent HTTP translation; all ownership and business rules live in services.
const createPlatformController = ({ progress, feedback, migration, admin }) => {
  const handle = (operation, status = 200) => async (req, res, next) => {
    try { return res.status(status).json(await operation(req)) } catch (error) { return next(error) }
  }
  return {
    stats: handle(req => progress.stats(req.actor)),
    history: handle(req => progress.history(req.actor, req.query)),
    achievements: handle(req => progress.achievements(req.actor)),
    createFeedback: handle(req => feedback.create(req.user.id, req.params.id, req.body), 201),
    getFeedback: handle(req => feedback.get(req.user.id, req.params.id)),
    updateFeedback: handle(req => feedback.update(req.user.id, req.params.id, req.body)),
    migrate: handle(req => migration.migrate(req.user.id, req.header('X-Guest-Token'))),
    adminStats: handle(() => admin.stats()),
    adminHistory: handle(req => admin.history(req.query)),
    adminFeedback: handle(req => admin.feedback(req.query)),
    updateUser: handle(req => admin.updateUser(req.user.id, req.params.id, req.body)),
    userCollection: handle(req => admin.collection(req.params.id)),
    userAchievements: handle(req => admin.achievements(req.params.id))
  }
}
module.exports = { createPlatformController }
