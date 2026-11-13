<script setup lang="ts">
import { computed } from 'vue'
import { CreditCard, GraduationCap, Mail, Phone, User } from 'lucide-vue-next'
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
    etiqueta="Nombre Completo (como aparece en tu credencial)"
    :error="errores.nombreCompleto"
    :icono="User"
    type="text"
    autocomplete="name"
    placeholder="Ej. Rodrigo Hernández Morales"
    @blur="emit('validar', 'nombreCompleto')"
  />
  <div class="grid grid-cols-2 gap-2">
    <BaseInput
      v-model="datos.matricula"
      etiqueta="Matrícula UTTT"
      :error="errores.matricula"
      :icono="CreditCard"
      class="font-mono"
      inputmode="numeric"
      maxlength="8"
      placeholder="22300630"
      @blur="emit('validar', 'matricula')"
    />
    <BaseInput
      v-model="datos.telefono"
      etiqueta="WhatsApp / Celular"
      :error="errores.telefono"
      :icono="Phone"
      type="tel"
      inputmode="numeric"
      autocomplete="tel"
      maxlength="10"
      placeholder="7731234567"
      @blur="emit('validar', 'telefono')"
    />
  </div>
  <div class="grid grid-cols-[1fr_auto] gap-2">
    <BaseSelect
      v-model="datos.carreraId"
      etiqueta="Carrera Universitaria"
      placeholder="Selecciona tu carrera"
      :icono="GraduationCap"
      :opciones="opcionesCarrera"
      :error="errores.carreraId"
      @blur="emit('validar', 'carreraId')"
    />
    <BaseSelect
      v-model="datos.cuatrimestre"
      etiqueta="Cuatrimestre"
      placeholder="—"
      :opciones="opcionesCuatrimestre"
      :error="errores.cuatrimestre"
    />
  </div>
  <BaseInput
    v-model="datos.correoInstitucional"
    :etiqueta="`Correo Institucional (@${dominio})`"
    :error="errores.correoInstitucional"
    :icono="Mail"
    :ayuda="`Solo miembros activos de la universidad con dominio @${dominio}`"
    type="email"
    inputmode="email"
    autocomplete="email"
    autocapitalize="off"
    :placeholder="`tu.correo@${dominio}`"
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
