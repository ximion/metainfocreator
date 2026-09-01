<template>
    <div class="box pl-1 pb-1">
        <!-- type="button" so this never acts as a submit control, whatever it
             ends up nested in -->
        <button type="button" style="float: right;" class="button is-info is-light is-rounded"
                @click="copyText(code)">Copy</button>
        <pre style="padding: 0 !important;"><code v-highlight="{ code, lang }"></code></pre>
    </div>
</template>

<script setup lang="ts">
import { copyText } from '../lib/clipboard';

defineProps<{
    code: string;
    /** Meson and desktop-entry files are highlighted with stand-in grammars;
        see the highlight directive. */
    lang: 'xml' | 'meson' | 'toml';
}>();
</script>
