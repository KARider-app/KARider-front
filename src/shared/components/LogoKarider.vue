<script setup lang="ts">
withDefaults(defineProps<{ tamano?: 'sm' | 'lg' }>(), {
  tamano: 'sm',
})

// Binding dinámico: una ruta estática aquí haría que el compilador de Vue la trate
// como un asset a resolver en build, y falla en Windows por ser absoluta a public/.
const iconoSrc = '/logo-karider.png'
const textoSrc = '/logo-karider-texto.png'
</script>

<template>
  <div class="logo" :class="`logo--${tamano}`">
    <img class="logo__icono" :src="iconoSrc" alt="" aria-hidden="true" width="48" height="48" />
    <img class="logo__texto" :src="textoSrc" alt="KARider" />
  </div>
</template>

<style scoped>
.logo {
  display: flex;
  align-items: center;
  gap: var(--espacio-2);
}

.logo--lg {
  flex-direction: column;
  gap: var(--espacio-2);
}

.logo__icono {
  flex: none;
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.logo--lg .logo__icono {
  width: 56px;
  height: 56px;
}

.logo__texto {
  height: 18px;
  width: auto;
  object-fit: contain;
}

.logo--lg .logo__texto {
  height: 28px;
}
</style>
