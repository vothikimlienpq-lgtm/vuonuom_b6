import { PointRule } from '../types';

/**
 * Hợp nhất quy định chuẩn với dữ liệu Firestore.
 *
 * - Quy định chuẩn luôn còn nguyên khi Firestore chỉ có quy định tự thêm.
 * - Bản ghi Firestore trùng id sẽ cập nhật quy định chuẩn tương ứng.
 * - Quy định có isDeleted=true được ẩn để thao tác xóa không bị hoàn tác.
 * - Thứ tự quy định chuẩn được giữ nguyên; quy định tự thêm nằm phía sau.
 */
export function mergePointRules(
  defaultRules: PointRule[] = [],
  persistedRules: PointRule[] = []
): PointRule[] {
  const merged = new Map<string, PointRule>();

  defaultRules.forEach((rule) => {
    merged.set(rule.id, { ...rule });
  });

  persistedRules.forEach((rule) => {
    if (!rule?.id) return;
    if (rule.isDeleted) {
      merged.delete(rule.id);
      return;
    }

    const defaultRule = merged.get(rule.id);
    merged.set(rule.id, {
      ...(defaultRule || {}),
      ...rule,
      id: rule.id,
    } as PointRule);
  });

  return Array.from(merged.values()).filter((rule) => !rule.isDeleted);
}
