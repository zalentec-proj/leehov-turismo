type CollectionKey = string | number;

type IncomingCollectionItem = {
  id: string;
  key: CollectionKey;
};

type ExistingCollectionItem = {
  id: string;
  key: CollectionKey;
};

export function resolveStableCollectionIds(
  incoming: readonly IncomingCollectionItem[],
  existing: readonly ExistingCollectionItem[],
  createId: () => string,
) {
  const existingIdByKey = new Map(existing.map((item) => [item.key, item.id]));
  const existingIds = new Set(existing.map((item) => item.id));
  const assignedIds = new Set<string>();

  return incoming.map((item) => {
    const idForKey = existingIdByKey.get(item.key);
    const reusableInputId = item.id && !existingIds.has(item.id) ? item.id : "";
    let resolvedId = idForKey || reusableInputId;

    while (!resolvedId || assignedIds.has(resolvedId) || (existingIds.has(resolvedId) && resolvedId !== idForKey)) {
      resolvedId = createId();
    }

    assignedIds.add(resolvedId);
    return resolvedId;
  });
}
