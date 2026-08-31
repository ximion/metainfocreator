<template>
    <div class="card">
        <header class="card-header">
          <p class="card-header-title">
            Categorization
          </p>
        </header>
        <div class="card-content content">
            <p><slot /></p>
            <div class="field is-grouped">

                <div class="control">
                  <label class="label">Primary Category</label>
                  <div class="select">
                    <select v-model="primary.value" @blur="primary.touch">
                        <option value="">Choose a category</option>
                        <option v-for="cat of primaryCategories" :key="cat.name" :value="cat.name">{{ cat.desc }} [{{ cat.name }}]</option>
                    </select>
                  </div>
                  <p v-if="primary.showErrors" class="help is-danger">A primary category must be selected</p>
                </div>

                <div class="control">
                  <label class="label">Secondary Category</label>
                  <div class="select">
                    <select v-model="secondary.value" @blur="secondary.touch">
                        <option value="">Choose an additional category</option>
                        <option v-for="cat of secondaryCategories" :key="cat.name" :value="cat.name">{{ cat.desc }} [{{ cat.name }}]</option>
                    </select>
                  </div>
                  <p v-if="secondaryRequired && secondary.showErrors" class="help is-danger">A secondary category must be selected</p>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

import type { Field } from '../forms/useForm';
import { loadAsset } from '../lib/loadasset';
import { filterCategoriesByPrimary, type PrimaryCategory, type SecondaryCategory } from '../lib/utils';

const props = defineProps<{
    primary: Field<string>;
    secondary: Field<string>;
    /** Services accept a primary category on its own. */
    secondaryRequired?: boolean;
}>();

const primaryCategories = ref<PrimaryCategory[]>([]);
const allSecondary = ref<SecondaryCategory[]>([]);
const secondaryCategories = ref<SecondaryCategory[]>([]);

onMounted(async () => {
    primaryCategories.value = await loadAsset<PrimaryCategory[]>('categories-primary.json');
    allSecondary.value = await loadAsset<SecondaryCategory[]>('categories-secondary.json');
});

// Only the secondary categories belonging to the chosen primary one are offered,
// so a previously picked one is dropped whenever the primary changes.
watch(() => props.primary.value, (chosen) => {
    props.secondary.set('');
    secondaryCategories.value = filterCategoriesByPrimary(allSecondary.value, chosen);
});
</script>
