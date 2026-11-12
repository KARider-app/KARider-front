<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, CirclePlus, Clock, FileText, MapPin } from 'lucide-vue-next'
import { fechaHora, mxn } from '@/core/utils/formato'
import AlertMessage from '@/shared/components/AlertMessage.vue'
import EncabezadoPantalla from '@/shared/components/EncabezadoPantalla.vue'
import { mensajeDeError } from '@/shared/composables/useApiError'
import { useBorradores } from '../../application/useBorradores'

const route = useRoute()
const { borradores, cargando, error, cargar } = useBorradores()
const guardado = route.query.guardado === '1'

onMounted(cargar)
</script>

<template>
  <main class="flex flex-col min-h-full flex-1 bg-[#F3F7FA] text-[#1D2D44]">
    <EncabezadoPantalla titulo="Mis Borradores" :volver="{ name: 'publicar-1' }">
      <p class="text-xs text-[#C9DCE8]">
        Los borradores no aparecen en la búsqueda de pasajeros hasta que los publiques.
      </p>
    </EncabezadoPantalla>

    <div class="p-5 space-y-3 flex-1 md:px-8 md:py-8 md:max-w-[76rem] md:mx-auto md:w-full">
      <AlertMessage v-if="guardado" tipo="exito">Tu viaje se guardó como borrador.</AlertMessage>
      <AlertMessage v-if="error" tipo="error">{{ mensajeDeError(error) }}</AlertMessage>
      <p v-if="cargando" class="py-8 text-center text-xs text-[#4B5563]">Cargando…</p>

      <section
        v-else-if="!error && borradores.length === 0"
        class="py-12 px-4 text-center rounded-2xl bg-white border border-[#C9DCE8]"
      >
        <FileText class="w-10 h-10 text-[#8AA9C4] mx-auto mb-2" aria-hidden="true" />
        <h2 class="text-sm font-bold text-[#1D2D44] font-sans">No tienes borradores guardados</h2>
      </section>

      <ul class="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
        <li v-for="v in borradores" :key="v.id">
          <RouterLink
            :to="{ name: 'viaje', params: { id: v.id } }"
            class="block h-full p-4 rounded-2xl bg-white border border-[#C9DCE8] shadow-xs hover:border-[#3E5C76] hover:shadow-md transition-all group"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="space-y-1 min-w-0">
                <div class="flex items-center gap-2 text-xs text-[#4B5563]">
                  <Clock class="w-3.5 h-3.5 text-[#3E5C76]" aria-hidden="true" />
                  <span>{{ fechaHora(v.fechaSalida) }}</span>
                </div>
                <div class="text-sm font-bold text-[#1D2D44]">
                  {{ v.puntoEncuentro.nombre }} → {{ v.destino }}
                </div>
                <div class="text-[11px] text-[#3E5C76] flex items-center gap-1">
                  <MapPin class="w-3 h-3 text-[#0284C7]" aria-hidden="true" />
                  <span>{{ v.asientosOfrecidos }} asientos ofrecidos</span>
                </div>
              </div>
              <div class="text-right shrink-0">
                <span
                  class="text-xs font-bold text-[#1D2D44] bg-[#EAF2F8] px-2.5 py-1 rounded-lg block"
                >
                  {{ mxn(v.aportePorAsiento) }}
                </span>
                <span class="text-[9px] text-[#4B5563] mt-1 block">por pasajero</span>
                <ChevronRight
                  class="w-4 h-4 text-[#8AA9C4] ml-auto mt-1 group-hover:translate-x-0.5 transition-transform"
                  aria-hidden="true"
                />
              </div>
            </div>
          </RouterLink>
        </li>
      </ul>

      <RouterLink
        :to="{ name: 'publicar-1' }"
        class="w-full md:max-w-xs md:mx-auto md:mt-4 py-2.5 px-4 rounded-xl border-2 border-[#1D2D44] text-[#1D2D44] font-bold text-xs hover:bg-[#EAF2F8] transition-all flex items-center justify-center gap-2"
      >
        <CirclePlus class="w-4 h-4" aria-hidden="true" />
        <span>Publicar una ruta nueva</span>
      </RouterLink>
    </div>
  </main>
</template>
