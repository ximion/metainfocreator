<template>
    <div class="card">
        <header class="card-header">
          <p class="card-header-title">
            Finish
          </p>
        </header>
        <div class="card-content content">

            <div class="field is-grouped">
                <div class="control">
                    <a class="button is-link" tabindex="0" @click="$emit('generate')">Generate Metadata</a>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
defineEmits<{ generate: [] }>();
</script>
