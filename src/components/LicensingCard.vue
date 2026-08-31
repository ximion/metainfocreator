<template>
    <div class="card">
        <header class="card-header">
          <p class="card-header-title">
            Licensing
          </p>
        </header>
        <div class="card-content content">

            <div class="field">
            <label class="label">Metadata License</label>
            <div class="control">
                <div class="select">
                    <select v-model="metadataLicense.value" @blur="metadataLicense.touch">
                        <option value="">Choose a metadata license</option>
                        <option v-for="license of metadataLicenses" :key="license.id" :value="license.id">{{ license.name }}</option>
                    </select>
                </div>
                <p class="help">The license that applies to this particular metadata and linked assets<span v-if="linkedAssets"> (like screenshots and videos)</span>.</p>

                <p v-if="metadataLicense.showErrors" class="help is-danger">A metadata license must be selected</p>
            </div>
            </div>

            <div class="field">
            <label class="label">Software License</label>

            <div class="control">
                <label class="radio">
                <input type="radio" value="simple" v-model="mode.value">
                Simple Single License
                </label>
                <label class="radio">
                <input type="radio" value="spdx" v-model="mode.value">
                Custom SPDX Expression
                </label>
            </div>
            </div>
            <div class="field is-grouped">
                <div class="control">
                <div class="select">
                    <!-- Greyed out rather than removed in SPDX mode, so the layout
                         does not jump when switching between the two. -->
                    <select v-model="simple.value" :disabled="spdxMode">
                        <option value="">Choose a project license</option>
                        <option v-for="license of spdxLicenses" :key="license.id" :value="license.id">{{ license.name }}</option>
                    </select>
                    </div>
                </div>

                <div v-if="spdxMode" class="control is-expanded">
                    <input class="input" v-model="complex.value" @blur="complex.touch" type="text" placeholder="A SPDX license expression, e.g. GPL-3.0-or-later and MPL-2.0">
                    <p class="help">A <a href="https://spdx.org/licenses/" target="_blank">SPDX</a> license expression string.</p>
                    <p v-if="complex.showErrors" class="help is-danger">You need to enter a SPDX expression</p>
                </div>
            </div>
            <p class="help">The license that applies to the described software.</p>

        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import type { Field } from '../forms/useForm';
import { loadAsset } from '../lib/loadasset';
import type { LicenseInfo } from '../lib/utils';

const props = defineProps<{
    metadataLicense: Field<string>;
    /** 'simple' or 'spdx' - which of the two license inputs is in use. */
    mode: Field<string>;
    simple: Field<string>;
    complex: Field<string>;
    /** The GUI app form also links screenshots, which the metadata license covers. */
    linkedAssets?: boolean;
}>();

const metadataLicenses = ref<LicenseInfo[]>([]);
const spdxLicenses = ref<LicenseInfo[]>([]);

const spdxMode = computed(() => props.mode.value === 'spdx');

onMounted(async () => {
    metadataLicenses.value = await loadAsset<LicenseInfo[]>('metadata-licenses.json');
    spdxLicenses.value = await loadAsset<LicenseInfo[]>('spdx-licenses.json');
});
</script>
