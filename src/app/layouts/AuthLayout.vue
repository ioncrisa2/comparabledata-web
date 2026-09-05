<template>
  <div class="auth-layout">
    <header class="auth-layout__brand" aria-label="HJAR Sysinfo">
      <span class="auth-layout__mark" aria-hidden="true">HJ</span>
      <span>HJAR Sysinfo</span>
    </header>
    <div class="auth-layout__content"><slot /></div>
    <p class="auth-layout__footer">Sistem informasi data pembanding properti</p>
  </div>
</template>

<style scoped>
.auth-layout {
  display: grid;
  min-height: 100vh;
  grid-template-rows: auto 1fr auto;
  justify-items: center;
  gap: 24px;
  padding: 24px;
}

.auth-layout__brand {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 10px;
  color: var(--color-ink-strong);
  font-weight: 700;
}

.auth-layout__mark {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 8px;
  background: var(--color-ink-strong);
  color: var(--color-brand-amber);
  font-size: 0.75rem;
}

.auth-layout__content {
  align-self: center;
  width: min(100%, 440px);
}

.auth-layout__footer {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 0.75rem;
}
</style>
