<script setup lang="ts">
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { env } from '@/shared/config/env'

const foundations = [
  {
    title: 'Kontrak API',
    detail: 'Client OpenAPI tunggal dengan session cookie, recovery CSRF, dan normalisasi error.',
    icon: 'pi pi-cloud',
  },
  {
    title: 'Server state',
    detail: 'Vue Query memiliki retry policy yang membedakan error akses dan jaringan.',
    icon: 'pi pi-database',
  },
  {
    title: 'Design system',
    detail: 'Token slate dan amber, Instrument Sans, PrimeVue, serta Tailwind sudah aktif.',
    icon: 'pi pi-palette',
  },
]
</script>

<template>
  <main id="main-content" class="foundation" tabindex="-1">
    <header class="foundation__header">
      <div class="foundation__brand" aria-label="HJAR Sysinfo">
        <span class="foundation__brand-mark" aria-hidden="true">HJ</span>
        <span>HJAR Sysinfo</span>
      </div>
      <UiStatusBadge tone="success" icon="pi pi-check-circle">Fondasi aktif</UiStatusBadge>
    </header>

    <section class="foundation__intro" aria-labelledby="foundation-title">
      <div>
        <p class="foundation__context">Meja operasional properti</p>
        <h1 id="foundation-title">Fondasi frontend siap digunakan</h1>
        <p class="foundation__lede">
          Struktur aplikasi, design tokens, dan lapisan data sudah tersusun. Integrasi feature akan
          mengikuti endpoint yang berstatus READY pada katalog API.
        </p>
      </div>
      <dl class="foundation__environment">
        <div>
          <dt>Aplikasi</dt>
          <dd>{{ env.VITE_APP_NAME }}</dd>
        </div>
        <div>
          <dt>API</dt>
          <dd>{{ env.VITE_API_BASE_URL }}</dd>
        </div>
        <div>
          <dt>Rilis</dt>
          <dd>{{ env.VITE_RELEASE }}</dd>
        </div>
      </dl>
    </section>

    <section class="foundation__workspace" aria-labelledby="workspace-title">
      <div class="foundation__section-heading">
        <div>
          <h2 id="workspace-title">Lapisan yang tersedia</h2>
          <p>Setiap feature baru memakai fondasi yang sama tanpa cache atau client kedua.</p>
        </div>
      </div>

      <UiSurface class="foundation__capabilities">
        <article v-for="item in foundations" :key="item.title" class="foundation__capability">
          <div class="foundation__item-icon" aria-hidden="true">
            <i :class="item.icon" />
          </div>
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.detail }}</p>
          </div>
        </article>
      </UiSurface>

      <UiSurface class="foundation__next" inset>
        <div>
          <h2>Integrasi autentikasi tersedia</h2>
          <p>
            Login, pemulihan sesi, permission, dan logout sudah memakai endpoint versioned. Tahap
            berikutnya adalah dictionary dan lokasi sebagai data referensi pertama.
          </p>
        </div>
        <UiStatusBadge tone="success" icon="pi pi-check-circle">Auth terintegrasi</UiStatusBadge>
      </UiSurface>
    </section>
  </main>
</template>

<style scoped>
.foundation {
  width: min(100% - 32px, 1120px);
  margin-inline: auto;
  padding-block: 24px 64px;
}

.foundation__header {
  display: flex;
  min-height: 56px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--color-border-soft);
}

.foundation__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--color-ink-strong);
  font-weight: 700;
}

.foundation__brand-mark {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 8px;
  background: var(--color-ink-strong);
  color: var(--color-brand-amber);
  font-size: 0.75rem;
  letter-spacing: -0.01em;
}

.foundation__intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
  align-items: end;
  gap: 48px;
  padding-block: 56px 48px;
}

.foundation__context {
  margin-bottom: 8px;
  color: var(--color-warning-text);
  font-size: 0.75rem;
  font-weight: 650;
}

.foundation h1 {
  max-width: 16ch;
  margin-bottom: 14px;
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.foundation__lede {
  max-width: 65ch;
  margin-bottom: 0;
  color: var(--color-ink-body);
  font-size: 1rem;
}

.foundation__environment {
  margin: 0;
  border-top: 1px solid var(--color-border);
}

.foundation__environment div {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
  border-bottom: 1px solid var(--color-border-soft);
  padding-block: 10px;
}

.foundation__environment dt {
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-weight: 650;
}

.foundation__environment dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--color-ink-strong);
  font-variant-numeric: tabular-nums;
}

.foundation__workspace {
  border-top: 1px solid var(--color-border);
  padding-top: 32px;
}

.foundation__section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 16px;
}

.foundation h2,
.foundation h3 {
  margin-bottom: 4px;
  font-size: 1rem;
  line-height: 1.4;
}

.foundation__section-heading p,
.foundation__item-icon + div p,
.foundation__next p {
  margin-bottom: 0;
  color: var(--color-ink-muted);
}

.foundation__capabilities {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 0;
  overflow: hidden;
}

.foundation__capability {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
}

.foundation__capability + .foundation__capability {
  border-left: 1px solid var(--color-border-soft);
}

.foundation__item-icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: var(--radius-control);
  background: var(--color-surface-inset);
  color: var(--color-ink-body);
}

.foundation__next {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 24px;
}

.foundation__next p {
  max-width: 70ch;
}

@media (max-width: 767px) {
  .foundation__intro {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 32px;
    padding-block: 40px;
  }

  .foundation__next {
    align-items: flex-start;
    flex-direction: column;
  }

  .foundation__capabilities {
    grid-template-columns: 1fr;
  }

  .foundation__capability + .foundation__capability {
    border-top: 1px solid var(--color-border-soft);
    border-left: 0;
  }
}

@media (max-width: 479px) {
  .foundation {
    width: min(100% - 24px, 1120px);
  }

  .foundation__header {
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    padding-block: 12px;
  }
}
</style>
