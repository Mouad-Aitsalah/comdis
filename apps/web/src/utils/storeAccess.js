export const LEGACY_STORE_CACHE_KEYS = [
  "stores",
  "storesCache",
  "stores-cache",
  "mockStores",
  "pointsDeVente",
  "pointsDeVenteCache",
];

export const cleanupLegacyStoreCache = () => {
  if (typeof localStorage === "undefined") {
    return;
  }

  LEGACY_STORE_CACHE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
};

export const getStoresCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.stores)) {
    return payload.stores;
  }

  return [];
};

export const normalizeStores = (payload) => {
  const rawStores = getStoresCollection(payload);
  const seenIds = new Set();

  return rawStores
    .map((store) => {
      const id = Number(store?.id ?? store?.storeId ?? store?.pointDeVenteId);
      const name =
        store?.name ??
        store?.nom ??
        store?.storeName ??
        store?.pointDeVenteName ??
        "";

      if (!Number.isFinite(id) || !String(name).trim()) {
        return null;
      }

      return {
        id,
        name: String(name).trim(),
      };
    })
    .filter((store) => {
      if (!store || seenIds.has(store.id)) {
        return false;
      }

      seenIds.add(store.id);
      return true;
    });
};
