<template>
    <div class="card">
        <header class="card-header">
          <p class="card-header-title">
            Additional Options
          </p>
        </header>
        <div class="card-content content">

            <div class="field">
            <div class="control">
                <label class="checkbox">
                <input type="checkbox" v-model="field.value">
                  Generate <a href="https://mesonbuild.com/">Meson</a> sample {{ plural ? 'snippets' : 'snippet' }} for metadata maintenance
                </label>
            </div>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import type { Field } from '../forms/useForm';

defineProps<{
    field: Field<boolean>;
    /** The GUI app form offers several snippets, the others only one. */
    plural?: boolean;
}>();
</script>
