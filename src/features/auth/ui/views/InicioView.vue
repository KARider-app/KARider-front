<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { env } from '@/core/config/env'
import LogoKarider from '@/shared/components/LogoKarider.vue'
import { useAuthStore } from '../../application/useAuthStore'

const auth = useAuthStore()

interface Opcion {
  titulo: string
  descripcion: string
  destino?: RouteLocationRaw
}

/** Las 5 opciones del MVP, una vez que el usuario ya inició sesión. */
const opciones = computed<Opcion[]>(() => [
  {
    titulo: `Hola, ${auth.usuario?.nombreCompleto.split(' ')[0] ?? ''}`,
    descripcion: `Sesión iniciada como ${auth.usuario?.rol}`,
  },
  auth.esConductor
    ? {
        titulo: 'Publicar ruta',
        descripcion: 'Comparte tu viaje y calcula el aporte solidario',
        destino: { name: 'publicar-1' },
      }
    : {
        titulo: 'Publicar ruta',
        descripcion: 'Disponible para cuentas de conductor',
      },
  {
    titulo: 'Consultar viajes',
    descripcion: 'Busca un viaje compatible con tu horario y aparta tu asiento',
    destino: { name: 'buscar' },
  },
  {
    titulo: 'Mapa de ruta',
    descripcion: 'Sigue a tu conductor desde tu reserva confirmada',
    destino: { name: 'mis-reservas' },
  },
  {
    titulo: 'Mi perfil',
    descripcion: 'Estadísticas, historial de viajes y calificaciones',
    destino: { name: 'perfil' },
  },
])

const iconosFlujo = {
  login: 'M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M21 12H9',
  registro: 'M9 12l2 2 4-4M21 12a9 9 0 11-9-9 9 9 0 019 9z',
  publicar:
    'M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11H5zM3 11h18v5a1 1 0 01-1 1H4a1 1 0 01-1-1v-5zM7.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  consultar: 'M12 2a7 7 0 00-7 7c0 5.25 7 12 7 12s7-6.75 7-12a7 7 0 00-7-7zM12 12a3 3 0 100-6 3 3 0 000 6z',
  perfil: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
}

/** Explicación del flujo del MVP para quien todavía no tiene sesión. */
const flujoMvp = [
  {
    numero: 1,
    titulo: 'Iniciar Sesión (Login)',
    descripcion: `Acceso con correo ${env.dominio}`,
    destino: { name: 'login' } as RouteLocationRaw,
    icono: iconosFlujo.login,
  },
  {
    numero: 2,
    titulo: 'Registro y Verificación Institucional',
    descripcion: 'Validación con matrícula y buzón UTTT',
    destino: { name: 'registro' } as RouteLocationRaw,
    icono: iconosFlujo.registro,
  },
  {
    numero: 3,
    titulo: 'Publicar Viaje (Conductor)',
    descripcion: 'Ruta, punto de encuentro, horario y aporte de gasolina',
    destino: { name: 'registro', query: { rol: 'Conductor' } } as RouteLocationRaw,
    icono: iconosFlujo.publicar,
  },
  {
    numero: 4,
    titulo: 'Consultar Viajes con Mapa de Rutas',
    descripcion: 'Punto de encuentro, solicitud y cálculo del aporte',
    destino: { name: 'buscar' } as RouteLocationRaw,
    icono: iconosFlujo.consultar,
  },
  {
    numero: 5,
    titulo: 'Perfil con Calificación Mutua',
    descripcion: 'Historial de viajes y evaluaciones mutuas',
    destino: { name: 'login' } as RouteLocationRaw,
    icono: iconosFlujo.perfil,
  },
]

const compromisos = [
  {
    titulo: '100% UTTT',
    descripcion: `Solo ${env.dominio}`,
    icono: 'M12 3L2 8l10 5 10-5-10-5zM6 10.5V15c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5',
  },
  {
    titulo: 'Aporte Justo',
    descripcion: 'Cálculo dinámico',
    icono:
      'M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v12M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1.1-3 2.5c0 1.4 1.3 2 3 2.5 1.7.5 3 1.1 3 2.5s-1.3 2.5-3 2.5-3-1.1-3-2.5',
  },
  {
    titulo: 'Eco Friendly',
    descripcion: 'Menos emisiones',
    icono: 'M12 3c-5 0-9 4-9 9 0 2 .7 3.8 2 5.2C8 14 10 11 14 9c-3 3-4 6-4.3 8.7A9 9 0 0021 12c0-5-4-9-9-9z',
  },
]
</script>

<template>
  <main class="pantalla">
    <template v-if="auth.autenticado">
      <header class="encabezado">
        <LogoKarider tamano="lg" class="encabezado__logo" />
        <p class="pantalla__subtitulo">Viajes compartidos entre la comunidad UTTT</p>
      </header>

      <nav class="opciones" aria-label="Opciones">
        <template v-for="o in opciones" :key="o.titulo">
          <RouterLink v-if="o.destino" :to="o.destino" class="opcion tarjeta">
            <strong>{{ o.titulo }}</strong>
            <span class="texto-suave">{{ o.descripcion }}</span>
          </RouterLink>
          <div v-else class="opcion tarjeta opcion--inactiva">
            <strong>{{ o.titulo }}</strong>
            <span class="texto-suave">{{ o.descripcion }}</span>
          </div>
        </template>
        <RouterLink v-if="auth.esConductor" :to="{ name: 'borradores' }" class="enlace-borradores">
          Ver mis borradores
        </RouterLink>
      </nav>
    </template>

    <template v-else>
      <header class="encabezado">
        <LogoKarider tamano="lg" class="encabezado__logo" />
        <p class="pantalla__subtitulo">
          Comparte ruta desde el campus, divide gasolina de forma justa y viaja seguro con
          compañeros universitarios.
        </p>
      </header>

      <h2 class="seccion-titulo centrado">Flujo oficial del MVP (5 funcionalidades)</h2>

      <nav class="flujo" aria-label="Flujo del MVP">
        <RouterLink v-for="p in flujoMvp" :key="p.numero" :to="p.destino" class="paso tarjeta">
          <span class="paso__icono" :class="`paso__icono--${p.numero}`" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path :d="p.icono" /></svg>
          </span>
          <span class="paso__texto">
            <strong>{{ p.numero }}. {{ p.titulo }}</strong>
            <span class="texto-suave">{{ p.descripcion }}</span>
          </span>
          <svg class="paso__flecha" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </RouterLink>
      </nav>

      <h2 class="seccion-titulo centrado">Compromiso institucional UTTT</h2>

      <div class="compromisos">
        <div v-for="c in compromisos" :key="c.titulo" class="tarjeta compromiso">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="c.icono" /></svg>
          <strong>{{ c.titulo }}</strong>
          <span class="texto-suave">{{ c.descripcion }}</span>
        </div>
      </div>
    </template>
  </main>
</template>

<style scoped>
.encabezado {
  padding: var(--espacio-6) var(--espacio-4);
  border-radius: var(--radio-lg);
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  box-shadow: var(--sombra-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--espacio-2);
  text-align: center;
}

.encabezado__logo {
  margin-bottom: var(--espacio-1);
}

.opciones {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-3);
}

.opcion {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: inherit;
  text-decoration: none;
}

a.opcion:hover {
  border-color: var(--color-acento);
}

.opcion--inactiva {
  opacity: 0.6;
}

.enlace-borradores {
  align-self: center;
  font-weight: 600;
}

.seccion-titulo {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-texto-suave);
}

.flujo {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-2);
}

.paso {
  display: flex;
  align-items: center;
  gap: var(--espacio-3);
  color: inherit;
  text-decoration: none;
}

.paso:hover {
  border-color: var(--color-acento);
}

.paso__icono {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.paso__icono svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: #fff;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.paso__icono--1 {
  background: var(--color-primario);
}

.paso__icono--2 {
  background: var(--color-acento);
}

.paso__icono--3 {
  background: var(--color-exito);
}

.paso__icono--4 {
  background: var(--color-aviso);
}

.paso__icono--5 {
  background: #7c3aed;
}

.paso__texto {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.paso__flecha {
  flex: none;
  width: 18px;
  height: 18px;
  fill: none;
  stroke: var(--color-deshabilitado);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.compromisos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--espacio-2);
}

.compromiso {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--espacio-1);
  text-align: center;
}

.compromiso svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: var(--color-acento);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.compromiso strong {
  font-size: 0.8125rem;
}

.compromiso .texto-suave {
  font-size: 0.75rem;
}
</style>
