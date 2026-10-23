<template>
  <div class="student-account-shell">
    <AppNavbar />
    <main class="student-account-page">
      <StudentSidebar />
      <section class="student-page student-account-content">
        <slot />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppNavbar from '@/components/AppNavbar.vue';
import StudentSidebar from './StudentSidebar.vue';
</script>

<style scoped>
.student-account-shell {
  min-height: 100vh;
  background: #f8fafc;
}

.student-account-page {
  display: grid;
  gap: 22px;
  grid-template-columns: 260px minmax(0, 1fr);
  margin: 0 auto;
  max-width: 1280px;
  padding: 28px 20px 56px;
}

.student-account-content {
  min-width: 0;
  padding: 0;
}

@media (max-width: 920px) {
  .student-account-page {
    grid-template-columns: 1fr;
  }
}
</style>
