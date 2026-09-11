/**
 * Xóa riêng một chỗ, chuyển học sinh sang chỗ trống hoặc hoán đổi hai học sinh.
 * Hàm luôn trả về bản sao mới và không cho một học sinh xuất hiện ở hai vị trí.
 */
export function moveOrSwapSeatAssignment(
  currentAssignments: Record<string, string>,
  targetSeatId: string,
  incomingStudentId: string
): Record<string, string> {
  const nextAssignments = { ...currentAssignments };
  const outgoingStudentId = nextAssignments[targetSeatId] || '';

  if (!incomingStudentId) {
    delete nextAssignments[targetSeatId];
    return nextAssignments;
  }

  if (incomingStudentId === outgoingStudentId) return nextAssignments;

  const sourceSeatId = Object.keys(nextAssignments).find(
    (seatId) => seatId !== targetSeatId && nextAssignments[seatId] === incomingStudentId
  );

  if (sourceSeatId) {
    if (outgoingStudentId) nextAssignments[sourceSeatId] = outgoingStudentId;
    else delete nextAssignments[sourceSeatId];
  }

  Object.keys(nextAssignments).forEach((seatId) => {
    if (seatId !== targetSeatId && nextAssignments[seatId] === incomingStudentId) {
      delete nextAssignments[seatId];
    }
  });
  nextAssignments[targetSeatId] = incomingStudentId;
  return nextAssignments;
}
