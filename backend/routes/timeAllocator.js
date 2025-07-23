// Time allocation logic for study planner
export function allocateTime(subtopics, totalMinutes) {
  // Assign weights
  const weights = { high: 3, medium: 2, low: 1 };
  let totalWeight = 0;
  subtopics.forEach(s => {
    totalWeight += weights[s.importance] || 1;
  });
  // Allocate time
  return subtopics.map(s => {
    const timeAllocated = Math.round((weights[s.importance] || 1) / totalWeight * totalMinutes);
    return { ...s, timeAllocated };
  });
}
