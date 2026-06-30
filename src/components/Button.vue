<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary' // primary, secondary, ghost, danger
  },
  size: {
    type: String,
    default: 'md' // sm, md, lg
  },
  disabled: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'button'
  }
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      variant === 'primary' ? 'btn-primary' : '',
      variant === 'secondary' ? 'btn-secondary' : '',
      variant === 'ghost' ? 'btn-ghost' : '',
      variant === 'danger' ? 'btn-danger' : '',
      size === 'sm' ? 'btn-sm' : '',
      size === 'lg' ? 'btn-lg' : '',
    ]"
    class="cursor-pointer"
  >
    <slot />
  </button>
</template>
