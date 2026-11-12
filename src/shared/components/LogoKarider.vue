<script setup lang="ts">
withDefaults(defineProps<{ tamano?: 'sm' | 'lg'; etiqueta?: boolean }>(), {
  tamano: 'sm',
  etiqueta: false,
})
</script>

<template>
  <div class="logo" :class="`logo--${tamano}`">
    <span class="logo__icono" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M5 17h14M5 17a2 2 0 104 0M15 17a2 2 0 104 0M3 13l2-6h14l2 6v4H3v-4zM3 13h18" />
      </svg>
      <span class="logo__punto"></span>
    </span>
    <span class="logo__texto">
      <strong class="logo__marca">KAR<span class="logo__acento">i</span>der</strong>
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
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: 32px;
  height: 32px;
  border: 2px solid var(--color-primario);
  border-radius: var(--radio-sm);
  color: var(--color-primario);
}

.logo--lg .logo__icono {
  width: 48px;
  height: 48px;
  border-radius: var(--radio-md);
}

.logo__icono svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.logo--lg .logo__icono svg {
  width: 26px;
  height: 26px;
}

.logo__punto {
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-acento);
  border: 2px solid var(--color-superficie);
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

.logo__acento {
  color: var(--color-acento);
}

.logo__etiqueta {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-texto-suave);
}
</style>
