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
  />
  <BaseInput
    v-model="datos.matricula"
    etiqueta="Matrícula UTTT"
    :error="errores.matricula"
    inputmode="numeric"
    maxlength="10"
    placeholder="Ej. 2023123456"
    @blur="emit('validar', 'matricula')"
  />
  <BaseInput
    v-model="datos.telefono"
    etiqueta="WhatsApp / Celular"
    :error="errores.telefono"
    type="tel"
    inputmode="tel"
    autocomplete="tel"
    placeholder="Ej. 773 123 4567"
    @blur="emit('validar', 'telefono')"
  />
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
    etiqueta="Correo institucional"
    :error="errores.correoInstitucional"
    type="email"
    inputmode="email"
    autocomplete="email"
    autocapitalize="off"
    :placeholder="`matricula@${dominio}`"
    @blur="emit('validar', 'correoInstitucional')"
  />
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
