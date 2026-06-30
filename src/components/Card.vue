<script setup>
defineProps({
  hover: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div :class="hover ? 'card-hover' : 'card'">
    <slot />
  </div>
</template>
