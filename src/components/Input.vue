<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  type: {
    type: String,
    default: 'text',
  },
  placeholder: String,
  required: {
    type: Boolean,
    default: false,
  },
  error: String,
  id: String,
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="input-label">{{ label }}</label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      :required="required"
      class="input"
    />
    <p v-if="error" class="text-accent-rose-500 text-xs mt-1.5">{{ error }}</p>
  </div>
</template>
