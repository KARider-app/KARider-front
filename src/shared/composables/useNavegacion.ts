import { computed, type Component } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'
import { CirclePlus, LogIn, LogOut, MapPin, Search, UserCheck } from 'lucide-vue-next'

export interface ItemNavegacion {
  clave: string
  texto: string
  icono: Component
  /** Sin destino: es la acción «Salir». */
  destino?: RouteLocationRaw
  /** Rutas en las que la opción se marca como activa. */
  rutas: string[]
  /** En la barra inferior móvil, el activo es navy o azul pin (como en los mockups). */
  activoPin: boolean
}

/** Opciones de la navegación principal; las comparten la barra inferior (móvil) y la superior (tablet/PC). */
export function useNavegacion(props: { autenticado: boolean; esConductor: boolean }) {
  const route = useRoute()

  const items = computed<ItemNavegacion[]>(() => [
    props.autenticado
      ? { clave: 'salir', texto: 'Salir', icono: LogOut, rutas: [], activoPin: false }
      : {
          clave: 'login',
          texto: 'Login',
          icono: LogIn,
          destino: { name: 'login' },
          rutas: ['login', 'registro', 'verificar', 'recuperar'],
          activoPin: false,
        },
    ...(props.esConductor
      ? [
          {
            clave: 'publicar',
            texto: 'Publicar',
            icono: CirclePlus,
            destino: { name: 'publicar-1' },
            rutas: ['publicar-1', 'publicar-2', 'borradores', 'viaje-editar'],
            activoPin: true,
          },
        ]
      : []),
    {
      clave: 'consultar',
      texto: 'Consultar',
      icono: Search,
      destino: { name: 'buscar' },
      rutas: ['buscar', 'viaje'],
      activoPin: true,
    },
    {
      clave: 'mapa',
      texto: 'Mapa Ruta',
      icono: MapPin,
      destino: { name: 'mis-reservas' },
      rutas: ['mis-reservas', 'mapa-reserva'],
      activoPin: true,
    },
    {
      clave: 'perfil',
      texto: 'Perfil',
      icono: UserCheck,
      destino: { name: 'perfil' },
      rutas: ['perfil'],
      activoPin: false,
    },
  ])

  const esActivo = (item: ItemNavegacion) => item.rutas.includes(String(route.name ?? ''))

  return { items, esActivo }
}
