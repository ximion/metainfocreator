<template>
    <div v-if="message" class="notification is-danger">
        <p><strong>Unable to generate metadata:</strong></p>
        <p>{{ message }}</p>
    </div>
</template>

<script setup lang="ts">
defineProps<{ message: string | null }>();
</script>
