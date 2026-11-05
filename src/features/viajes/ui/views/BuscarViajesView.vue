<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/application/useAuthStore'
import { useCatalogosStore } from '@/features/catalogos/application/useCatalogosStore'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import BaseSelect from '@/shared/components/BaseSelect.vue'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { useBuscarViajes, type FiltrosViajes } from '../../application/useBuscarViajes'
import type { OrdenViajes } from '../../domain/tipos'
import TarjetaViaje from '../components/TarjetaViaje.vue'

const router = useRouter()
const auth = useAuthStore()
const catalogos = useCatalogosStore()
const { viajes, total, tieneSiguiente, cargando, cargandoMas, buscado, error, buscar, cargarMas } =
  useBuscarViajes()

const filtros = reactive<{
  destino: string
  puntoEncuentroId: string | number
  orden: OrdenViajes
}>({
  destino: '',
  puntoEncuentroId: 0,
  orden: 'Horario',
})

const ordenes: { valor: OrdenViajes; texto: string }[] = [
  { valor: 'Horario', texto: 'Horario' },
  { valor: 'MenorAporte', texto: 'Menor aporte' },
  { valor: 'Calificacion', texto: 'Calificación' },
]

// Catálogo controlado de puntos de encuentro (regla 4): no es texto libre.
const opcionesPuntos = computed(() => [
  { valor: 0, texto: 'Todos' },
  ...catalogos.puntosEncuentro.map((p) => ({ valor: p.id, texto: p.nombre })),
])

function filtrosActuales(): FiltrosViajes {
  return {
    destino: filtros.destino,
    puntoEncuentroId: Number(filtros.puntoEncuentroId) || undefined,
    orden: filtros.orden,
  }
}

const ejecutar = () => buscar(filtrosActuales())

// Cambiar el orden o el punto de encuentro vuelve a consultar sin recargar la página.
watch(() => [filtros.orden, filtros.puntoEncuentroId], ejecutar)

onMounted(() => {
  void catalogos.cargarPuntosEncuentro()
  void ejecutar()
})

const textoContador = computed(
  () => `${total.value} ${total.value === 1 ? 'viaje disponible' : 'viajes disponibles'}`,
)
const sinResultados = computed(
  () => buscado.value && !cargando.value && !error.value && viajes.value.length === 0,
)
</script>

<template>
  <main class="pantalla">
    <header>
      <h1 class="pantalla__titulo">Consultar viajes</h1>
      <p class="pantalla__subtitulo">Encuentra un viaje compatible con tu horario y ubicación.</p>
    </header>

    <form class="formulario tarjeta" role="search" @submit.prevent="ejecutar">
      <BaseInput
        v-model="filtros.destino"
        etiqueta="Destino"
        type="search"
        placeholder="Ej. Pachuca"
        autocomplete="off"
        maxlength="100"
      />
      <BaseSelect
        v-model="filtros.puntoEncuentroId"
        etiqueta="Punto de encuentro"
        :opciones="opcionesPuntos"
      />

      <fieldset class="orden">
        <legend class="orden__etiqueta">Ordenar por</legend>
        <div class="orden__opciones">
          <label
            v-for="o in ordenes"
            :key="o.valor"
            class="orden__opcion"
            :class="{ 'orden__opcion--activa': filtros.orden === o.valor }"
          >
            <input
              v-model="filtros.orden"
              type="radio"
              name="orden"
              :value="o.valor"
              class="sr-only"
            />
            {{ o.texto }}
          </label>
        </div>
      </fieldset>

      <BaseButton type="submit" variante="acento" bloque :cargando="cargando">BUSCAR</BaseButton>
    </form>

    <AlertMessage v-if="error" tipo="error">{{ mensajeDeError(error) }}</AlertMessage>

    <template v-if="buscado && !error">
      <p v-if="!sinResultados" class="contador" role="status" aria-live="polite">
        {{ textoContador }}
      </p>

      <!-- P6: estado vacío -->
      <section v-if="sinResultados" class="vacio tarjeta" aria-live="polite">
        <h2>No se encontraron viajes</h2>
        <p class="texto-suave">
          Ningún viaje programado coincide con tu búsqueda. Prueba con otro destino o punto de
          encuentro.
        </p>
        <BaseButton
          v-if="auth.esConductor"
          variante="secundario"
          @click="router.push({ name: 'publicar-1' })"
        >
          Publicar Ruta
        </BaseButton>
        <p v-else class="texto-suave">
          ¿Tienes vehículo? Con una cuenta de conductor puedes publicar tu propia ruta.
        </p>
      </section>

      <ul v-else class="lista">
        <li v-for="v in viajes" :key="v.id">
          <TarjetaViaje :viaje="v" />
        </li>
      </ul>

      <BaseButton
        v-if="tieneSiguiente"
        variante="secundario"
        bloque
        :cargando="cargandoMas"
        @click="cargarMas(filtrosActuales())"
      >
        Ver más viajes
      </BaseButton>
    </template>

    <p v-else-if="cargando" class="texto-suave centrado">Buscando viajes…</p>
  </main>
</template>

<style scoped>
.orden {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-2);
  margin: 0;
  padding: 0;
  border: 0;
}

.orden__etiqueta {
  margin-bottom: var(--espacio-2);
  padding: 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.orden__opciones {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--espacio-2);
}

.orden__opcion {
  display: grid;
  place-items: center;
  min-height: 44px;
  padding: 0 var(--espacio-2);
  border: 2px solid var(--color-borde);
  border-radius: var(--radio-md);
  background: var(--color-superficie);
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
}

.orden__opcion--activa {
  border-color: var(--color-primario);
  background: var(--color-primario);
  color: #fff;
}

.orden__opcion:has(input:focus-visible) {
  outline: 3px solid var(--color-acento);
  outline-offset: 2px;
}

.contador {
  font-weight: 700;
}

.lista {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--espacio-3);
  text-align: center;
}
</style>
