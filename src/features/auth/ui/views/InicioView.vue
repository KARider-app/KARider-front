<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import {
  ArrowRight,
  Car,
  CirclePlus,
  FileText,
  Fuel,
  Leaf,
  LogIn,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from 'lucide-vue-next'
import { env } from '@/core/config/env'
import LogoKarider from '@/shared/components/LogoKarider.vue'
import { useAuthStore } from '../../application/useAuthStore'

const auth = useAuthStore()

interface Accion {
  titulo: string
  descripcion: string
  destino: RouteLocationRaw
  icono: Component
  color: string
  hover: string
}

/** Acciones rápidas (Dashboard de los mockups) una vez iniciada la sesión. */
const acciones = computed<Accion[]>(() => [
  {
    titulo: 'Explorar Viajes',
    descripcion: 'Rutas activas hoy',
    destino: { name: 'buscar' },
    icono: Search,
    color: 'text-[#0284C7]',
    hover: 'hover:border-[#3E5C76]',
  },
  ...(auth.esConductor
    ? [
        {
          titulo: 'Publicar Ruta',
          descripcion: 'Ofertar asientos',
          destino: { name: 'publicar-1' },
          icono: CirclePlus,
          color: 'text-[#3E5C76]',
          hover: 'hover:border-[#3E5C76]',
        },
        {
          titulo: 'Mis Borradores',
          descripcion: 'Retomar publicaciones',
          destino: { name: 'borradores' },
          icono: FileText,
          color: 'text-[#1D2D44]',
          hover: 'hover:border-[#3E5C76]',
        },
      ]
    : []),
  {
    titulo: 'Mapa Ubicación',
    descripcion: 'Seguimiento GPS ruta',
    destino: { name: 'mis-reservas' },
    icono: Navigation,
    color: 'text-[#0284C7]',
    hover: 'hover:border-[#0284C7]',
  },
  {
    titulo: 'Mi Perfil',
    descripcion: 'Historial y calificaciones',
    destino: { name: 'perfil' },
    icono: UserCheck,
    color: 'text-amber-600',
    hover: 'hover:border-[#3E5C76]',
  },
])

const iniciales = computed(() =>
  (auth.usuario?.nombreCompleto ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join(''),
)

/** Flujo oficial del MVP para quien todavía no tiene sesión. */
const flujoMvp = [
  {
    id: 'login',
    titulo: '1. Iniciar Sesión (Login)',
    descripcion: `Acceso con correo @${env.dominio}`,
    destino: { name: 'login' } as RouteLocationRaw,
    icono: LogIn,
    fondo: 'bg-white/10',
    color: 'text-[#8AA9C4]',
  },
  {
    id: 'registro',
    titulo: '2. Registro y Verificación Institucional',
    descripcion: 'Validación con matrícula y buzón UTTT',
    destino: { name: 'registro' } as RouteLocationRaw,
    icono: UserPlus,
    fondo: 'bg-[#EAF2F8]',
    color: 'text-[#0284C7]',
  },
  {
    id: 'publicar',
    titulo: '3. Publicar Viaje (Conductor)',
    descripcion: 'Ruta, punto campus, horario y aporte gasolina',
    destino: { name: 'registro', query: { rol: 'Conductor' } } as RouteLocationRaw,
    icono: Car,
    fondo: 'bg-sky-50',
    color: 'text-[#0284C7]',
  },
  {
    id: 'consultar',
    titulo: '4. Consultar Viajes con Mapa de Rutas',
    descripcion: 'Punto de encuentro, solicitud y cálculo',
    destino: { name: 'buscar' } as RouteLocationRaw,
    icono: MapPin,
    fondo: 'bg-emerald-50',
    color: 'text-emerald-600',
  },
  {
    id: 'perfil',
    titulo: '5. Perfil con Calificación Mutua',
    descripcion: 'Historial de viajes y evaluaciones mutuas',
    destino: { name: 'login' } as RouteLocationRaw,
    icono: UserCheck,
    fondo: 'bg-amber-50',
    color: 'text-amber-600',
  },
]

const compromisos = [
  {
    titulo: '100% UTTT',
    descripcion: `Solo @${env.dominio}`,
    icono: ShieldCheck,
    color: 'text-emerald-600',
  },
  { titulo: 'Aporte Justo', descripcion: 'Cálculo dinámico', icono: Fuel, color: 'text-sky-600' },
  { titulo: 'Eco Friendly', descripcion: 'Menos emisiones', icono: Leaf, color: 'text-teal-600' },
]
</script>

<template>
  <!-- Con sesión: Dashboard -->
  <main v-if="auth.autenticado" class="flex flex-col min-h-full flex-1 bg-[#F3F7FA] text-[#1D2D44]">
    <header class="bg-[#1D2D44] text-white px-5 pt-5 pb-5 rounded-b-3xl shadow-md">
      <div class="flex items-center justify-between mb-4">
        <LogoKarider variant="horizontal" size="sm" text-color="light" />
      </div>
      <div
        class="flex items-center justify-between bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="relative shrink-0">
            <img
              v-if="auth.usuario?.fotoUrl"
              :src="auth.usuario.fotoUrl"
              :alt="auth.usuario.nombreCompleto"
              class="w-12 h-12 rounded-full object-cover border-2 border-[#8AA9C4]"
            />
            <div
              v-else
              class="w-12 h-12 rounded-full border-2 border-[#8AA9C4] bg-[#3E5C76] flex items-center justify-center text-sm font-black"
              aria-hidden="true"
            >
              {{ iniciales }}
            </div>
            <div
              class="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border border-[#1D2D44]"
            >
              <ShieldCheck class="w-3 h-3 text-white" aria-hidden="true" />
            </div>
          </div>
          <div class="min-w-0">
            <span class="text-sm font-bold block truncate">{{ auth.usuario?.nombreCompleto }}</span>
            <span class="text-[11px] text-[#C9DCE8] block leading-tight truncate">
              {{ auth.usuario?.correoInstitucional }}
            </span>
          </div>
        </div>
      </div>
      <div
        class="mt-4 flex items-center justify-between bg-[#111827]/40 p-1 rounded-xl border border-white/10"
      >
        <span class="text-[11px] font-semibold text-[#C9DCE8] pl-2">Modo activo:</span>
        <span
          class="px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 text-white shadow-xs"
          :class="auth.esConductor ? 'bg-[#0284C7]' : 'bg-[#3E5C76]'"
        >
          <Car v-if="auth.esConductor" class="w-3.5 h-3.5" aria-hidden="true" />
          <UserCheck v-else class="w-3.5 h-3.5" aria-hidden="true" />
          <span>{{ auth.usuario?.rol }}</span>
        </span>
      </div>
    </header>

    <div class="p-5 space-y-4 flex-1">
      <div>
        <h1 class="text-xs font-bold uppercase tracking-wider text-[#3E5C76] mb-2 font-sans">
          Acciones Rápidas
        </h1>
        <nav class="grid grid-cols-2 gap-2.5" aria-label="Acciones rápidas">
          <RouterLink
            v-for="a in acciones"
            :key="a.titulo"
            :to="a.destino"
            class="p-3.5 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs flex items-center gap-3 text-left transition-all"
            :class="a.hover"
          >
            <div
              class="w-10 h-10 rounded-xl bg-[#EAF2F8] flex items-center justify-center shrink-0"
              :class="a.color"
            >
              <component :is="a.icono" class="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div class="text-xs font-bold text-[#1D2D44]">{{ a.titulo }}</div>
              <div class="text-[10px] text-[#4B5563]">{{ a.descripcion }}</div>
            </div>
          </RouterLink>
        </nav>
      </div>
    </div>
  </main>

  <!-- Sin sesión: Inicio PWA -->
  <main
    v-else
    class="flex flex-col min-h-full flex-1 bg-gradient-to-b from-[#EAF2F8] via-[#F3F7FA] to-white text-[#1D2D44]"
  >
    <header
      class="pt-4 px-5 pb-3 flex items-center justify-between border-b border-[#C9DCE8]/50 bg-white/60 backdrop-blur-xs"
    >
      <LogoKarider variant="horizontal" size="xs" :show-subtitle="false" />
      <div
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300/60 text-[11px] font-extrabold text-emerald-800"
      >
        <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
        <span>Validación UTTT</span>
      </div>
    </header>

    <div class="px-5 pt-4 pb-5 text-center flex flex-col items-center">
      <div class="my-1 p-2 bg-white/70 rounded-3xl border border-[#C9DCE8]/70 shadow-sm">
        <LogoKarider variant="full" size="lg" />
      </div>
      <h1 class="text-xl sm:text-2xl font-black text-[#1D2D44] tracking-tight mt-3 leading-tight">
        Carpooling Universitario UTTT
      </h1>
      <p class="text-xs text-[#3E5C76] mt-1.5 max-w-xs leading-relaxed">
        Comparte ruta desde el campus, divide gasolina de forma justa y viaja seguro con compañeros
        universitarios.
      </p>

      <nav class="w-full mt-5 space-y-2" aria-label="Flujo del MVP">
        <h2
          class="text-[11px] font-extrabold text-[#3E5C76] uppercase tracking-wider text-left px-1 font-sans"
        >
          Flujo Oficial del MVP (5 Funcionalidades):
        </h2>
        <RouterLink
          v-for="(p, i) in flujoMvp"
          :key="p.id"
          :to="p.destino"
          class="w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all"
          :class="
            i === 0
              ? 'bg-[#1D2D44] text-white shadow-md shadow-[#1D2D44]/20 hover:bg-[#3E5C76]'
              : 'bg-white border border-[#C9DCE8] text-[#1D2D44] shadow-xs hover:bg-[#EAF2F8]'
          "
        >
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center" :class="p.fondo">
              <component :is="p.icono" class="w-4 h-4" :class="p.color" aria-hidden="true" />
            </div>
            <div class="text-left">
              <div>{{ p.titulo }}</div>
              <div
                class="text-[10px] font-normal"
                :class="i === 0 ? 'text-[#C9DCE8]' : 'text-[#4B5563]'"
              >
                {{ p.descripcion }}
              </div>
            </div>
          </div>
          <ArrowRight
            class="w-4 h-4"
            :class="i === 0 ? 'text-[#8AA9C4]' : 'text-[#3E5C76]'"
            aria-hidden="true"
          />
        </RouterLink>
      </nav>
    </div>

    <section class="px-5 py-4 space-y-2 border-t border-[#C9DCE8]/50 bg-white">
      <h2 class="text-[11px] font-bold uppercase tracking-wider text-[#3E5C76] font-sans">
        Compromiso Institucional UTTT
      </h2>
      <div class="grid grid-cols-3 gap-2 text-center text-xs">
        <div
          v-for="c in compromisos"
          :key="c.titulo"
          class="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#EDEDED]"
        >
          <component
            :is="c.icono"
            class="w-5 h-5 mx-auto mb-1"
            :class="c.color"
            aria-hidden="true"
          />
          <span class="font-bold text-[#1D2D44] block text-[11px]">{{ c.titulo }}</span>
          <span class="text-[9px] text-[#4B5563]">{{ c.descripcion }}</span>
        </div>
      </div>
    </section>
  </main>
</template>
