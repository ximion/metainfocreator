<template>
    <div class="field">
        <label class="label">{{ label }}</label>
        <div class="control" :class="{ 'has-icons-left': icon }">
            <textarea v-if="multiline" class="textarea" v-model="field.value" @blur="field.touch"
                      :placeholder="placeholder"></textarea>
            <input v-else class="input" type="text" v-model="field.value" @blur="field.touch"
                   :placeholder="placeholder">
            <span v-if="icon" class="icon is-small is-left">
                <i :class="icon"></i>
            </span>
        </div>

        <p v-if="$slots.help" class="help"><slot name="help" /></p>

        <!-- A field with several possible complaints names each one; a field that
             can only fail one way just shows its single message. -->
        <div v-if="messages && field.showErrors">
            <template v-for="(text, key) of messages" :key="key">
                <p v-if="field.errors[key]" class="help is-danger">{{ text }}</p>
            </template>
        </div>
        <p v-else-if="message && field.showErrors" class="help is-danger">{{ message }}</p>
    </div>
</template>

<script setup lang="ts">
import type { Field } from '../forms/useForm';

defineProps<{
    /** The form field this input is bound to. */
    field: Field<string>;
    label: string;
    placeholder?: string;
    /** Font Awesome classes for a left-hand icon, e.g. "fas fa-link". */
    icon?: string;
    multiline?: boolean;
    /** Shown whenever the field is invalid, for fields that can only fail one way. */
    message?: string;
    /** Maps an error name to the message explaining it. */
    messages?: Record<string, string>;
}>();
</script>
