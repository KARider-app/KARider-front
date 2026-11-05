<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { env } from '@/core/config/env'
import { useAuthStore } from '../../application/useAuthStore'

const auth = useAuthStore()

interface Opcion {
  titulo: string
  descripcion: string
  destino?: RouteLocationRaw
}

/** Las 5 opciones del MVP. Las que aún no existen se muestran como «Próximamente». */
const opciones = computed<Opcion[]>(() => [
  auth.autenticado
    ? {
        titulo: `Hola, ${auth.usuario?.nombreCompleto.split(' ')[0] ?? ''}`,
        descripcion: `Sesión iniciada como ${auth.usuario?.rol}`,
      }
    : {
        titulo: 'Iniciar sesión / Registrarme',
        descripcion: 'Entra con tu correo institucional',
        destino: { name: 'login' },
      },
  auth.esConductor
    ? {
        titulo: 'Publicar ruta',
        descripcion: 'Comparte tu viaje y calcula el aporte solidario',
        destino: { name: 'publicar-1' },
      }
    : {
        titulo: 'Publicar ruta',
        descripcion: auth.autenticado
          ? 'Disponible para cuentas de conductor'
          : 'Regístrate como conductor con tu vehículo',
        destino: auth.autenticado ? undefined : { name: 'registro', query: { rol: 'Conductor' } },
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
  { titulo: 'Mi perfil', descripcion: 'Próximamente' },
])
</script>

<template>
  <main class="pantalla">
    <header class="encabezado">
      <h1 class="marca">{{ env.appNombre }}</h1>
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
  </main>
</template>

<style scoped>
.encabezado {
  padding: var(--espacio-5) var(--espacio-4);
  border-radius: var(--radio-lg);
  background: var(--color-primario);
  color: #fff;
}

.encabezado .pantalla__subtitulo {
  color: #c6d2e3;
}

.marca {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
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
</style>
