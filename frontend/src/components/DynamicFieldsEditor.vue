<template>
  <div v-if="fields.length > 0" class="dynamic-fields">
    <h3>{{ title }}</h3>
    <label v-for="field in fields" :key="field.id">
      {{ field.etiqueta }}<span v-if="field.requerido"> *</span>

      <textarea
        v-if="field.tipo === 'textarea'"
        :value="stringValue(field.id)"
        :placeholder="field.placeholder || ''"
        :required="field.requerido"
        rows="4"
        @input="setValue(field.id, ($event.target as HTMLTextAreaElement).value)"
      />

      <select
        v-else-if="field.tipo === 'select'"
        :value="stringValue(field.id)"
        :required="field.requerido"
        @change="setValue(field.id, ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Selecciona una opcion</option>
        <option v-for="option in field.opciones || []" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <select
        v-else-if="field.tipo === 'multi_select'"
        :value="arrayValue(field.id)"
        :required="field.requerido"
        multiple
        @change="setMultiValue(field.id, $event)"
      >
        <option v-for="option in field.opciones || []" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <input
        v-else-if="field.tipo === 'checkbox'"
        :checked="booleanValue(field.id)"
        type="checkbox"
        @change="setValue(field.id, ($event.target as HTMLInputElement).checked)"
      />

      <input
        v-else
        :type="inputType(field.tipo)"
        :value="stringValue(field.id)"
        :placeholder="field.placeholder || ''"
        :required="field.requerido"
        :min="field.tipo === 'percentage' ? 0 : undefined"
        :max="field.tipo === 'percentage' ? 100 : undefined"
        :step="['number', 'currency', 'percentage'].includes(field.tipo) ? 'any' : undefined"
        @input="setValue(field.id, ($event.target as HTMLInputElement).value)"
      />

      <small v-if="field.ayuda">{{ field.ayuda }}</small>
      <small v-if="errors[field.id]" class="field-error">{{ errors[field.id] }}</small>
    </label>
  </div>
</template>

<script setup lang="ts">
import type { FieldType, FormField } from '@/stores/parametrizacion';

type DynamicValue = string | string[] | boolean | null;

const props = withDefaults(
  defineProps<{
    fields: FormField[];
    modelValue: Record<string, DynamicValue>;
    errors?: Record<string, string>;
    title?: string;
  }>(),
  {
    errors: () => ({}),
    title: 'Campos dinamicos',
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, DynamicValue>];
}>();

const inputType = (type: FieldType) => {
  const map: Partial<Record<FieldType, string>> = {
    number: 'number',
    currency: 'number',
    percentage: 'number',
    date: 'date',
    url: 'url',
    email: 'email',
    phone: 'tel',
  };
  return map[type] || 'text';
};

const stringValue = (fieldId: string) => {
  const value = props.modelValue[fieldId];
  if (Array.isArray(value)) return value.join(',');
  if (typeof value === 'boolean') return value ? 'true' : '';
  return value ?? '';
};

const arrayValue = (fieldId: string) => {
  const value = props.modelValue[fieldId];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value) return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
};

const booleanValue = (fieldId: string) => Boolean(props.modelValue[fieldId]);

const setValue = (fieldId: string, value: DynamicValue) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [fieldId]: value,
  });
};

const setMultiValue = (fieldId: string, event: Event) => {
  const select = event.target as HTMLSelectElement;
  setValue(
    fieldId,
    Array.from(select.selectedOptions).map((option) => option.value)
  );
};
</script>

<style scoped>
.dynamic-fields {
  border-top: 1px solid #e5e7eb;
  display: grid;
  gap: 12px;
  margin-top: 8px;
  padding-top: 12px;
}

.dynamic-fields h3 {
  margin: 0;
}

label {
  display: grid;
  font-weight: 700;
  gap: 6px;
}

input,
select,
textarea {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font: inherit;
  padding: 10px 12px;
}

select[multiple] {
  min-height: 110px;
}

small {
  color: #64748b;
}

.field-error {
  color: #991b1b;
}
</style>
