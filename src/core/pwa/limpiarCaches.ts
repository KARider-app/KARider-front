/**
 * Cachés del service worker que ya no se usan y deben borrarse.
 * - mapa-osm: guardaba mosaicos del mapa bloqueados por OpenStreetMap (se veían en gris). La reemplaza mapa-osm-v2.
 */
export const CACHES_OBSOLETAS = ['mapa-osm'] as const

/** Borra las cachés obsoletas; no bloquea el arranque ni falla si el navegador no tiene Cache Storage. */
export async function limpiarCachesObsoletas(
  almacen: CacheStorage | undefined = globalThis.caches,
) {
  if (!almacen) return
  await Promise.all(CACHES_OBSOLETAS.map((nombre) => almacen.delete(nombre).catch(() => false)))
}
