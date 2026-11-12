<script setup lang="ts">
withDefaults(defineProps<{ tamano?: 'sm' | 'lg'; etiqueta?: boolean }>(), {
  tamano: 'sm',
  etiqueta: false,
})

// Binding dinámico: una ruta estática aquí haría que el compilador de Vue la trate
// como un asset a resolver en build, y falla en Windows por ser absoluta a public/.
const logoSrc = '/logo-karider.png'
</script>

<template>
  <div class="logo" :class="`logo--${tamano}`">
    <img class="logo__icono" :src="logoSrc" alt="" aria-hidden="true" width="48" height="48" />
    <span class="logo__texto">
      <strong class="logo__marca" aria-label="KARider">
        KAR<span class="logo__i">
          <svg class="logo__pin" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2c-3.3 0-6 2.7-6 6 0 4.5 6 12 6 12s6-7.5 6-12c0-3.3-2.7-6-6-6z"
            />
          </svg>
          ı</span
        >der
      </strong>
      <span v-if="etiqueta" class="logo__etiqueta">Carpooling UTTT</span>
    </span>
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
  text-align: center;
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
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.logo--lg .logo__texto {
  align-items: center;
  gap: var(--espacio-1);
}

.logo__marca {
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-primario);
  letter-spacing: -0.01em;
}

.logo--lg .logo__marca {
  font-size: 1.5rem;
}

.logo__i {
  position: relative;
  display: inline-block;
}

.logo__pin {
  position: absolute;
  left: 50%;
  bottom: 100%;
  width: 0.5em;
  height: 0.5em;
  transform: translateX(-50%);
  fill: var(--color-acento);
}

.logo__etiqueta {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-texto-suave);
}
</style>
