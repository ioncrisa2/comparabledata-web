<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiEmptyState from '@/shared/components/ui/UiEmptyState.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiSkeleton from '@/shared/components/ui/UiSkeleton.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'

import {
  useDuplicateReviewQuery,
  useResolveDuplicateMutation,
} from '../composables/useDuplicateReview'

const route = useRoute()
const submissionId = computed(() => String(route.params.submissionId ?? ''))

const reviewQuery = useDuplicateReviewQuery(submissionId)
const resolveMutation = useResolveDuplicateMutation()

const selectedCandidateId = ref<number | null>(null)
const confirmStrategy = ref<'use_existing' | 'replace_existing' | null>(null)
const resolveSuccess = ref(false)

const submission = computed(() => reviewQuery.data.value?.submission)
const candidates = computed(() => reviewQuery.data.value?.candidates ?? [])

function selectCandidate(id: number) {
  selectedCandidateId.value = id
  confirmStrategy.value = null
}

function prepareStrategy(strategy: 'use_existing' | 'replace_existing') {
  confirmStrategy.value = strategy
}

async function confirmResolve() {
  if (!selectedCandidateId.value || !confirmStrategy.value) return

  await resolveMutation.mutateAsync(
    {
      submissionId: submissionId.value,
      strategy: confirmStrategy.value,
      candidateId: selectedCandidateId.value,
    },
    {
      onSuccess: () => {
        resolveSuccess.value = true
      },
    },
  )
}

function cancel() {
  confirmStrategy.value = null
}

const strategyLabel = computed(() =>
  confirmStrategy.value === 'use_existing'
    ? 'Data baru dibatalkan. Data lama yang ada tetap digunakan.'
    : 'Data yang ada akan diganti dengan data baru yang Anda masukkan.',
)
</script>

<template>
  <main id="main-content" class="duplicate-review" tabindex="-1">
    <header class="duplicate-review__heading">
      <RouterLink class="duplicate-review__back" :to="{ name: 'pembanding.list' }">
        <i class="pi pi-arrow-left" aria-hidden="true" /> Kembali ke daftar
      </RouterLink>
      <h1>Tinjau data duplikat</h1>
      <p>Data yang Anda masukkan terindikasi mirip dengan data yang sudah ada. Pilih tindakan yang sesuai.</p>
    </header>

    <!-- Sukses -->
    <UiSurface v-if="resolveSuccess" class="duplicate-review__success">
      <UiEmptyState
        title="Duplikat berhasil ditangani"
        description="Keputusan Anda sudah disimpan. Data pembanding diperbarui sesuai pilihan."
        icon="pi pi-check-circle"
      >
        <template #actions>
          <RouterLink class="ui-button ui-button--primary" :to="{ name: 'pembanding.list' }">
            Kembali ke daftar
          </RouterLink>
        </template>
      </UiEmptyState>
    </UiSurface>

    <!-- Loading -->
    <div v-else-if="reviewQuery.isPending.value" class="duplicate-review__loading" role="status">
      <span class="sr-only">Memuat data duplikat</span>
      <UiSkeleton height="10rem" />
      <UiSkeleton height="20rem" />
    </div>

    <!-- Error -->
    <UiSurface v-else-if="reviewQuery.isError.value" class="duplicate-review__error">
      <UiInlineAlert tone="error" title="Gagal memuat data duplikat">
        <p>
          {{
            isApiError(reviewQuery.error.value)
              ? reviewQuery.error.value.message
              : 'Terjadi gangguan saat mengambil data duplikat.'
          }}
        </p>
        <UiButton size="sm" @click="reviewQuery.refetch()">Coba lagi</UiButton>
      </UiInlineAlert>
    </UiSurface>

    <template v-else-if="submission">
      <!-- Data yang baru dimasukkan -->
      <UiSurface class="duplicate-review__submission">
        <div class="duplicate-review__section-heading">
          <h2>Data baru yang Anda masukkan</h2>
          <span class="duplicate-review__badge duplicate-review__badge--new">Baru</span>
        </div>
        <div class="duplicate-review__columns">
          <img
            v-if="submission.image_url"
            :src="submission.image_url"
            alt="Foto data baru"
            class="duplicate-review__image"
          />
          <dl class="duplicate-review__details">
            <div v-for="row in submission.rows" :key="row.key" class="duplicate-review__detail-row">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
        </div>
        <p class="duplicate-review__expiry">
          <i class="pi pi-clock" aria-hidden="true" />
          Sesi ini berakhir pada {{ new Date(submission.expires_at).toLocaleString('id-ID') }}
        </p>
      </UiSurface>

      <!-- Data kandidat duplikat -->
      <div class="duplicate-review__candidates">
        <h2 class="duplicate-review__candidates-title">
          Data yang sudah ada ({{ candidates.length }} kandidat)
        </h2>
        <p class="duplicate-review__candidates-hint">
          Pilih data yang paling mirip, lalu tentukan tindakan.
        </p>

        <div
          v-for="candidate in candidates"
          :key="candidate.id"
          class="duplicate-review__candidate"
          :class="{ 'duplicate-review__candidate--selected': selectedCandidateId === candidate.id }"
        >
          <button
            type="button"
            class="duplicate-review__candidate-selector"
            :aria-pressed="selectedCandidateId === candidate.id"
            @click="selectCandidate(candidate.id)"
          >
            <span class="duplicate-review__candidate-header">
              <span class="duplicate-review__radio" aria-hidden="true">
                <i v-if="selectedCandidateId === candidate.id" class="pi pi-check-circle" />
                <i v-else class="pi pi-circle" />
              </span>
              <span>
                <strong>#{{ candidate.id }}</strong> — Dibuat oleh {{ candidate.created_by }}
              </span>
              <span v-if="candidate.deleted" class="duplicate-review__badge duplicate-review__badge--deleted">
                Terhapus
              </span>
            </span>
          </button>

          <div class="duplicate-review__columns">
            <img
              v-if="candidate.image_url"
              :src="candidate.image_url"
              :alt="`Foto kandidat #${candidate.id}`"
              class="duplicate-review__image"
            />
            <dl class="duplicate-review__details">
              <div v-for="row in candidate.rows" :key="row.key" class="duplicate-review__detail-row">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </div>
            </dl>
          </div>

          <!-- Aksi saat kandidat ini dipilih -->
          <div v-if="selectedCandidateId === candidate.id" class="duplicate-review__actions">
            <template v-if="!confirmStrategy">
              <UiButton @click="prepareStrategy('use_existing')">
                <template #icon><i class="pi pi-arrow-left" aria-hidden="true" /></template>
                Pertahankan data lama ini, batalkan input baru
              </UiButton>
              <UiButton variant="primary" @click="prepareStrategy('replace_existing')">
                <template #icon><i class="pi pi-sync" aria-hidden="true" /></template>
                Ganti data lama ini dengan input baru
              </UiButton>
            </template>

            <template v-else>
              <UiInlineAlert tone="warning" title="Konfirmasi tindakan">
                <p>{{ strategyLabel }}</p>
              </UiInlineAlert>

              <UiInlineAlert
                v-if="resolveMutation.isError.value"
                tone="error"
                title="Gagal memproses"
              >
                <p>
                  {{
                    isApiError(resolveMutation.error.value)
                      ? resolveMutation.error.value.message
                      : 'Terjadi gangguan. Coba lagi.'
                  }}
                </p>
              </UiInlineAlert>

              <div class="duplicate-review__confirm-buttons">
                <UiButton :disabled="resolveMutation.isPending.value" @click="cancel">
                  Batal
                </UiButton>
                <UiButton
                  variant="primary"
                  :loading="resolveMutation.isPending.value"
                  @click="confirmResolve"
                >
                  Ya, lanjutkan
                </UiButton>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>
  </main>
</template>

<style scoped>
.duplicate-review {
  width: min(100% - 32px, 1100px);
  margin-inline: auto;
  padding-block: 28px 64px;
}

.duplicate-review__back {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--color-ink-body);
  font-size: 0.8125rem;
  font-weight: 650;
  text-decoration: none;
}

.duplicate-review__back:hover {
  color: var(--color-action-primary);
}

.duplicate-review__heading {
  margin-bottom: 24px;
}

.duplicate-review__heading h1 {
  margin-bottom: 8px;
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.duplicate-review__heading p {
  margin: 0;
  color: var(--color-ink-muted);
}

.duplicate-review__loading {
  display: grid;
  gap: 16px;
}

.duplicate-review__error,
.duplicate-review__success {
  padding: 24px;
}

.duplicate-review__submission {
  padding: 20px;
  margin-bottom: 24px;
}

.duplicate-review__section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.duplicate-review__section-heading h2 {
  margin: 0;
  font-size: 1rem;
}

.duplicate-review__badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.duplicate-review__badge--new {
  background: var(--color-brand-amber-soft);
  color: var(--color-warning-text);
}

.duplicate-review__badge--deleted {
  background: var(--color-surface-inset);
  color: var(--color-ink-muted);
}

.duplicate-review__columns {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 20px;
  align-items: start;
}

.duplicate-review__image {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-control);
  object-fit: cover;
  border: 1px solid var(--color-border-soft);
}

.duplicate-review__details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px 16px;
  margin: 0;
}

.duplicate-review__detail-row dt {
  color: var(--color-ink-muted);
  font-size: 0.6875rem;
  font-weight: 650;
}

.duplicate-review__detail-row dd {
  margin: 2px 0 0;
  color: var(--color-ink-strong);
  font-size: 0.8125rem;
  font-weight: 650;
}

.duplicate-review__expiry {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 16px 0 0;
  color: var(--color-ink-muted);
  font-size: 0.75rem;
}

.duplicate-review__candidates-title {
  margin: 0 0 6px;
  font-size: 1.125rem;
}

.duplicate-review__candidates-hint {
  margin: 0 0 16px;
  color: var(--color-ink-muted);
  font-size: 0.875rem;
}

.duplicate-review__candidate {
  border: 2px solid var(--color-border-soft);
  border-radius: var(--radius-surface);
  margin-bottom: 16px;
  overflow: hidden;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.duplicate-review__candidate--selected {
  border-color: var(--color-action-primary);
}

.duplicate-review__candidate-selector {
  display: block;
  width: 100%;
  border: 0;
  background: var(--color-surface-inset);
  padding: 12px 16px;
  cursor: pointer;
  text-align: left;
}

.duplicate-review__candidate-selector:hover {
  background: var(--color-brand-amber-soft);
}

.duplicate-review__candidate-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.duplicate-review__radio {
  color: var(--color-ink-muted);
  font-size: 1.125rem;
}

.duplicate-review__candidate--selected .duplicate-review__radio {
  color: var(--color-action-primary);
}

.duplicate-review__columns {
  padding: 16px;
}

.duplicate-review__actions {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid var(--color-border-soft);
  background: var(--color-surface-inset);
}

.duplicate-review__confirm-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 767px) {
  .duplicate-review__columns {
    grid-template-columns: 1fr;
  }

  .duplicate-review__details {
    grid-template-columns: repeat(2, 1fr);
  }

  .duplicate-review__actions {
    flex-direction: column;
  }

  .duplicate-review__confirm-buttons {
    flex-wrap: wrap;
  }
}
</style>
