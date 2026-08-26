<template>
  <div class="auth-layout">
    <div class="auth-layout__content"><slot /></div>
  </div>
</template>

<style scoped>
.auth-layout {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
}

.auth-layout__content {
  width: min(100%, 440px);
}
</style>
