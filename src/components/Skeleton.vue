<template>
  <div
    :class="[
      'animate-pulse bg-[#E5E8EC] rounded-lg',
      variant === 'circle' ? 'rounded-full' : '',
      customClass
    ]"
    :style="style"
  ></div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String, // 'rect' | 'circle'
    default: 'rect'
  },
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '1rem'
  },
  customClass: {
    type: String,
    default: ''
  }
})

const style = computed(() => {
  return {
    width: props.width,
    height: props.height,
  }
})
</script>
