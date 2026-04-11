export function getTaskRole(task, userId) {
  if (!task || userId == null) return null;
  const uid = String(userId);
  const creatorId = task.createdBy?._id ?? task.createdBy;
  const assigneeId = task.assignee?._id ?? task.assignee;

  if (task.taskType === 'personal') {
    if (String(creatorId) === uid) return 'owner';
    return null;
  }

  if (task.taskType === 'assigned') {
    if (String(creatorId) === uid) return 'assigner';
    if (assigneeId && String(assigneeId) === uid) return 'assignee';
  }
  return null;
}

export const STATUS_LABELS = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
};
