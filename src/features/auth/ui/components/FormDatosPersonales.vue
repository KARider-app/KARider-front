<script setup lang="ts">
import { computed } from 'vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import BaseSelect from '@/shared/components/BaseSelect.vue'
import PasswordInput from '@/shared/components/PasswordInput.vue'
import type { Errores } from '@/shared/composables/useFormulario'
import type { Carrera } from '@/features/catalogos/domain/tipos'

export interface DatosPersonales {
  nombreCompleto: string
  matricula: string
  telefono: string
  carreraId: number | ''
  cuatrimestre: number | ''
  correoInstitucional: string
  password: string
  confirmarPassword: string
}

const props = defineProps<{ errores: Errores; carreras: Carrera[]; dominio: string }>()
const emit = defineEmits<{ validar: [campo: string] }>()
const datos = defineModel<DatosPersonales>({ required: true })

const opcionesCarrera = computed(() =>
  props.carreras.map((c) => ({ valor: c.id, texto: c.nombre })),
)
const opcionesCuatrimestre = Array.from({ length: 11 }, (_, i) => ({
  valor: i + 1,
  texto: `${i + 1}.º cuatrimestre`,
}))
</script>

<template>
  <BaseInput
    v-model="datos.nombreCompleto"
    etiqueta="Nombre completo"
    :error="errores.nombreCompleto"
    type="text"
    autocomplete="name"
    placeholder="Como aparece en tu credencial"
    @blur="emit('validar', 'nombreCompleto')"
  >
    <template #prefijo>
      <span class="campo__icono campo__icono--prefijo" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      </span>
    </template>
  </BaseInput>
  <BaseInput
    v-model="datos.matricula"
    etiqueta="Matrícula UTTT"
    :error="errores.matricula"
    inputmode="numeric"
    maxlength="10"
    placeholder="Ej. 2023123456"
    @blur="emit('validar', 'matricula')"
  >
    <template #prefijo>
      <span class="campo__icono campo__icono--prefijo" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 15h4" />
        </svg>
      </span>
    </template>
  </BaseInput>
  <BaseInput
    v-model="datos.telefono"
    etiqueta="WhatsApp / Celular"
    :error="errores.telefono"
    type="tel"
    inputmode="tel"
    autocomplete="tel"
    placeholder="Ej. 773 123 4567"
    @blur="emit('validar', 'telefono')"
  >
    <template #prefijo>
      <span class="campo__icono campo__icono--prefijo" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.46-1.46a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z"
          />
        </svg>
      </span>
    </template>
  </BaseInput>
  <div class="fila">
    <BaseSelect
      v-model="datos.carreraId"
      etiqueta="Carrera"
      placeholder="Selecciona tu carrera"
      :opciones="opcionesCarrera"
      :error="errores.carreraId"
      @blur="emit('validar', 'carreraId')"
    />
    <BaseSelect
      v-model="datos.cuatrimestre"
      etiqueta="Cuatrimestre (opcional)"
      placeholder="—"
      :opciones="opcionesCuatrimestre"
      :error="errores.cuatrimestre"
    />
  </div>
  <BaseInput
    v-model="datos.correoInstitucional"
    :etiqueta="`Correo institucional (@${dominio})`"
    :error="errores.correoInstitucional"
    type="email"
    inputmode="email"
    autocomplete="email"
    autocapitalize="off"
    :placeholder="`matricula@${dominio}`"
    @blur="emit('validar', 'correoInstitucional')"
  >
    <template #prefijo>
      <span class="campo__icono campo__icono--prefijo" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M3 5h18v14H3z" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </span>
    </template>
  </BaseInput>
  <PasswordInput
    v-model="datos.password"
    etiqueta="Contraseña"
    nueva
    :error="errores.password"
    ayuda="Mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial."
    @blur="emit('validar', 'password')"
  />
  <PasswordInput
    v-model="datos.confirmarPassword"
    etiqueta="Confirma tu contraseña"
    nueva
    :error="errores.confirmarPassword"
    @blur="emit('validar', 'confirmarPassword')"
  />
</template>
