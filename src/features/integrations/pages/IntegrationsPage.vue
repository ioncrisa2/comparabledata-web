<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, onBeforeUnmount, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiConfirmDialog from '@/shared/components/ui/UiConfirmDialog.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatDateTime } from '@/shared/formatters'

import type { IntegrationItem, IntegrationKeyItem, IntegrationScope } from '../api/integrations.api'
import {
  fetchIntegration,
  fetchIntegrations,
  issueIntegrationKey,
  revokeIntegrationKey,
  saveIntegration,
  scopeOptions,
  setIntegrationActive,
} from '../api/integrations.api'

const client = useQueryClient()
const page = ref(1)
const selectedId = ref<number | null>(null)
const list = useQuery({
  queryKey: computed(() => ['integrations', 'list', page.value]),
  queryFn: ({ signal }) => fetchIntegrations(page.value, signal),
})
const detail = useQuery({
  queryKey: computed(() => ['integrations', 'detail', selectedId.value]),
  queryFn: ({ signal }) => fetchIntegration(selectedId.value!, signal),
  enabled: computed(() => selectedId.value !== null),
})
const selected = computed(() => detail.data.value)
const busy = ref(false)
const error = ref('')
const message = ref('')

function selectApp(id: number) {
  selectedId.value = id
  error.value = ''
}
const appDialog = ref(false)
const editId = ref<number>()
const appName = ref('')
const rate = ref(60)
const keyDialog = ref(false)
const keyName = ref('')
const scopes = ref<IntegrationScope[]>(scopeOptions.map((scope) => scope.value))
const expiryDays = ref(90)
const plainText = ref('')
const copied = ref(false)
const copyError = ref('')
const pending = ref<
  { type: 'revoke'; key: IntegrationKeyItem } | { type: 'toggle'; app: IntegrationItem } | null
>(null)

function promptToggleApp(app: IntegrationItem) {
  pending.value = { type: 'toggle', app }
  error.value = ''
}

function promptRevokeKey(key: IntegrationKeyItem) {
  pending.value = { type: 'revoke', key }
  error.value = ''
}
const confirmTitle = computed(() =>
  pending.value?.type === 'revoke'
    ? 'Cabut API key?'
    : pending.value?.app.is_active
      ? 'Nonaktifkan aplikasi?'
      : 'Aktifkan aplikasi?',
)
const confirmDescription = computed(() =>
  pending.value?.type === 'revoke'
    ? `Key “${pending.value.key.name}” tidak dapat digunakan lagi. Pastikan aplikasi sudah memakai key pengganti.`
    : pending.value?.app.is_active
      ? 'Semua key aplikasi ini akan berhenti mendapat akses sampai aplikasi diaktifkan kembali.'
      : 'Key yang belum kedaluwarsa atau dicabut akan dapat digunakan kembali.',
)

function errorText(value: unknown) {
  if (isApiError(value)) {
    const fields = Object.values(value.fieldErrors).flat().join(' ')
    return fields || value.message
  }
  return 'Permintaan belum berhasil. Silakan coba lagi.'
}
async function refresh() {
  await client.invalidateQueries({ queryKey: ['integrations'] })
}
function openApp(app?: IntegrationItem) {
  error.value = ''
  editId.value = app?.id
  appName.value = app?.name ?? ''
  rate.value = app?.requests_per_minute ?? 60
  appDialog.value = true
}
async function submitApp() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const app = await saveIntegration(
      { name: appName.value.trim(), requests_per_minute: rate.value },
      editId.value,
    )
    selectedId.value = app.id
    appDialog.value = false
    message.value = editId.value
      ? 'Pengaturan aplikasi disimpan.'
      : 'Aplikasi ditambahkan. Terbitkan API key untuk mulai menghubungkan.'
    await refresh()
  } catch (cause) {
    error.value = errorText(cause)
  } finally {
    busy.value = false
  }
}
function openKey() {
  keyName.value = ''
  scopes.value = scopeOptions.map((scope) => scope.value)
  expiryDays.value = 90
  error.value = ''
  keyDialog.value = true
}
async function submitKey() {
  if (!selectedId.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    const expires = new Date()
    expires.setDate(expires.getDate() + expiryDays.value)
    // Keep the one-time secret only in component memory, never a query/mutation cache.
    const issued = await issueIntegrationKey(selectedId.value, {
      name: keyName.value.trim(),
      scopes: scopes.value,
      expires_at: expires.toISOString(),
    })
    plainText.value = issued.plain_text_key
    copied.value = false
    copyError.value = ''
    keyDialog.value = false
    await refresh()
  } catch (cause) {
    error.value = errorText(cause)
  } finally {
    busy.value = false
  }
}
async function copyKey() {
  try {
    await navigator.clipboard.writeText(plainText.value)
    copied.value = true
    copyError.value = ''
  } catch {
    copyError.value = 'Penyalinan otomatis gagal. Pilih teks key di bawah dan salin secara manual.'
  }
}
async function confirmAction() {
  if (!pending.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    if (pending.value.type === 'revoke' && selectedId.value) {
      await revokeIntegrationKey(selectedId.value, pending.value.key.id)
      message.value = 'API key dicabut.'
    } else if (pending.value.type === 'toggle') {
      await setIntegrationActive(pending.value.app.id, !pending.value.app.is_active)
      message.value = pending.value.app.is_active
        ? 'Akses aplikasi dinonaktifkan.'
        : 'Akses aplikasi diaktifkan.'
    }
    pending.value = null
    await refresh()
  } catch (cause) {
    error.value = errorText(cause)
  } finally {
    busy.value = false
  }
}
function keyStatus(key: IntegrationKeyItem) {
  if (key.revoked_at) return 'Dicabut'
  if (new Date(key.expires_at).getTime() <= Date.now()) return 'Kedaluwarsa'
  return selected.value?.is_active ? 'Aktif' : 'Aplikasi nonaktif'
}
onBeforeRouteLeave(
  () =>
    !plainText.value ||
    window.confirm(
      'API key belum ditutup. Key tidak dapat ditampilkan kembali. Tinggalkan halaman?',
    ),
)
onBeforeUnmount(() => {
  plainText.value = ''
})
</script>

<template>
  <div class="integrations-page">
    <header class="integrations-page__header">
      <div>
        <h1>Integrasi aplikasi</h1>
        <p>Kelola akses aplikasi penilaian ke data pembanding melalui API key.</p>
      </div>
      <UiButton variant="primary" @click="openApp()">Tambah aplikasi</UiButton>
    </header>
    <UiInlineAlert
      v-if="message"
      tone="success"
      :title="message"
      dismissible
      @dismiss="message = ''"
    />
    <UiInlineAlert
      v-if="error && !appDialog && !keyDialog && !pending"
      tone="error"
      :title="error"
    />
    <UiInlineAlert
      v-if="list.isError.value"
      tone="error"
      title="Daftar aplikasi belum dapat dimuat"
    >
      {{ errorText(list.error.value) }}
      <UiButton size="sm" @click="list.refetch()">Coba lagi</UiButton>
    </UiInlineAlert>
    <p v-else-if="list.isPending.value" role="status">Memuat aplikasi…</p>
    <UiSurface v-else-if="list.data.value?.data.length === 0">
      <h2>Belum ada aplikasi terhubung</h2>
      <p>Tambahkan aplikasi, lalu terbitkan key dengan izin dan masa berlaku yang dibutuhkan.</p>
    </UiSurface>
    <div v-else class="integrations-page__workspace">
      <UiSurface class="integrations-page__applications" aria-label="Daftar aplikasi">
        <h2>Aplikasi</h2>
        <button
          v-for="app in list.data.value?.data"
          :key="app.id"
          class="integrations-page__app"
          :aria-pressed="selectedId === app.id"
          @click="selectApp(app.id)"
        >
          <strong>{{ app.name }}</strong
          ><span
            >{{ app.is_active ? 'Aktif' : 'Nonaktif' }} ·
            {{ app.requests_per_minute }} request/menit per key</span
          >
        </button>
        <nav
          v-if="(list.data.value?.meta.last_page ?? 1) > 1"
          class="integrations-page__actions"
          aria-label="Halaman aplikasi"
        >
          <UiButton size="sm" :disabled="page <= 1" @click="page--">Sebelumnya</UiButton>
          <span>{{ page }} / {{ list.data.value?.meta.last_page }}</span>
          <UiButton
            size="sm"
            :disabled="page >= (list.data.value?.meta.last_page ?? 1)"
            @click="page++"
            >Berikutnya</UiButton
          >
        </nav>
      </UiSurface>
      <UiSurface class="integrations-page__detail">
        <p v-if="!selectedId">Pilih aplikasi untuk melihat dan mengelola API key.</p>
        <p v-else-if="detail.isPending.value" role="status">Memuat API key…</p>
        <UiInlineAlert
          v-else-if="detail.isError.value"
          tone="error"
          title="Detail aplikasi belum dapat dimuat"
        >
          {{ errorText(detail.error.value) }}
          <UiButton size="sm" @click="detail.refetch()">Coba lagi</UiButton>
        </UiInlineAlert>
        <template v-else-if="selected">
          <div class="integrations-page__header">
            <div>
              <h2>{{ selected.name }}</h2>
              <UiStatusBadge :tone="selected.is_active ? 'success' : 'neutral'">{{
                selected.is_active ? 'Aktif' : 'Nonaktif'
              }}</UiStatusBadge>
            </div>
            <div class="integrations-page__actions">
              <UiButton size="sm" @click="openApp(selected)">Pengaturan</UiButton
              ><UiButton size="sm" @click="promptToggleApp(selected)">{{
                selected.is_active ? 'Nonaktifkan' : 'Aktifkan'
              }}</UiButton>
            </div>
          </div>
          <div class="integrations-page__header">
            <h3>API key</h3>
            <UiButton variant="primary" :disabled="!selected.is_active" @click="openKey"
              >Terbitkan key</UiButton
            >
          </div>
          <p>
            Untuk mengganti key, terbitkan key baru dan perbarui aplikasi penilaian sebelum mencabut
            key lama.
          </p>
          <p v-if="selected.keys.length === 0">Belum ada API key untuk aplikasi ini.</p>
          <ul v-else class="integrations-page__keys">
            <li v-for="key in selected.keys" :key="key.id">
              <div class="integrations-page__header">
                <strong>{{ key.name }}</strong
                ><UiStatusBadge :tone="keyStatus(key) === 'Aktif' ? 'success' : 'neutral'">{{
                  keyStatus(key)
                }}</UiStatusBadge>
              </div>
              <code>{{ key.prefix }}…</code>
              <dl>
                <div>
                  <dt>Berlaku sampai</dt>
                  <dd>{{ formatDateTime(key.expires_at) }}</dd>
                </div>
                <div>
                  <dt>Terakhir digunakan</dt>
                  <dd>
                    {{ key.last_used_at ? formatDateTime(key.last_used_at) : 'Belum digunakan' }}
                  </dd>
                </div>
              </dl>
              <ul class="integrations-page__scopes">
                <li v-for="scope in key.scopes" :key="scope">
                  {{ scopeOptions.find((item) => item.value === scope)?.label ?? scope }}
                </li>
              </ul>
              <UiButton
                v-if="!key.revoked_at"
                size="sm"
                variant="danger"
                @click="promptRevokeKey(key)"
                >Cabut key {{ key.name }}</UiButton
              >
            </li>
          </ul>
        </template>
      </UiSurface>
    </div>

    <UiDialog
      v-model:open="appDialog"
      :title="editId ? 'Pengaturan aplikasi' : 'Tambah aplikasi'"
      :dismissable="!busy"
    >
      <form id="integration-app-form" class="integrations-page__form" @submit.prevent="submitApp">
        <UiInlineAlert v-if="error" tone="error" :title="error" />
        <UiField for="integration-name" label="Nama aplikasi" required
          ><input id="integration-name" v-model="appName" maxlength="255" required
        /></UiField>
        <UiField
          for="integration-rate"
          label="Batas request per menit per key"
          help="Berlaku untuk gabungan endpoint yang diakses satu key."
          required
          ><input
            id="integration-rate"
            v-model.number="rate"
            type="number"
            min="1"
            max="600"
            required
        /></UiField>
      </form>
      <template #footer
        ><UiButton :disabled="busy" @click="appDialog = false">Batal</UiButton
        ><UiButton type="submit" form="integration-app-form" variant="primary" :loading="busy"
          >Simpan aplikasi</UiButton
        ></template
      >
    </UiDialog>
    <UiDialog
      v-model:open="keyDialog"
      title="Terbitkan API key"
      :description="selected?.name"
      :dismissable="!busy"
    >
      <form id="integration-key-form" class="integrations-page__form" @submit.prevent="submitKey">
        <UiInlineAlert v-if="error" tone="error" :title="error" />
        <UiField
          for="integration-key-name"
          label="Nama key"
          help="Contoh: Penilaian produksi September."
          required
          ><input id="integration-key-name" v-model="keyName" maxlength="255" required
        /></UiField>
        <UiField for="integration-expiry" label="Masa berlaku (hari)" required
          ><input
            id="integration-expiry"
            v-model.number="expiryDays"
            type="number"
            min="1"
            max="365"
            required
        /></UiField>
        <fieldset>
          <legend>Izin akses</legend>
          <label
            v-for="scope in scopeOptions"
            :key="scope.value"
            class="integrations-page__checkbox"
            ><input v-model="scopes" type="checkbox" :value="scope.value" />{{ scope.label }}</label
          >
        </fieldset>
        <p>Pilih minimal satu izin. Key hanya ditampilkan sekali setelah diterbitkan.</p>
      </form>
      <template #footer
        ><UiButton :disabled="busy" @click="keyDialog = false">Batal</UiButton
        ><UiButton
          type="submit"
          form="integration-key-form"
          variant="primary"
          :loading="busy"
          :disabled="scopes.length === 0"
          >Terbitkan key</UiButton
        ></template
      >
    </UiDialog>
    <UiDialog
      :open="Boolean(plainText)"
      title="Simpan API key sekarang"
      description="Salin ke pengaturan integrasi di backend aplikasi penilaian. Key tidak dapat ditampilkan kembali setelah ditutup."
      :dismissable="false"
    >
      <div class="integrations-page__form">
        <UiInlineAlert v-if="copyError" tone="error" :title="copyError" />
        <UiField for="integration-secret" label="API key">
          <textarea
            id="integration-secret"
            :value="plainText"
            readonly
            rows="4"
            spellcheck="false"
          />
        </UiField>
        <UiButton @click="copyKey">{{ copied ? 'Key tersalin' : 'Salin API key' }}</UiButton>
        <p aria-live="polite">
          {{
            copied
              ? 'Tempelkan key di aplikasi penilaian sebelum menutup tampilan ini.'
              : 'Simpan key di backend; jangan masukkan ke kode frontend atau repositori.'
          }}
        </p>
      </div>
      <template #footer
        ><UiButton variant="primary" @click="plainText = ''"
          >Saya sudah menyimpan key</UiButton
        ></template
      >
    </UiDialog>
    <UiConfirmDialog
      :open="Boolean(pending)"
      :title="confirmTitle"
      :description="confirmDescription"
      :confirm-label="
        pending?.type === 'revoke'
          ? 'Cabut key'
          : pending?.app.is_active
            ? 'Nonaktifkan'
            : 'Aktifkan'
      "
      :confirm-variant="
        pending?.type === 'revoke' || (pending?.type === 'toggle' && pending.app.is_active)
          ? 'danger'
          : 'primary'
      "
      :busy="busy"
      @update:open="
        (open) => {
          if (!open) pending = null
        }
      "
      @confirm="confirmAction"
      ><UiInlineAlert v-if="error" tone="error" :title="error"
    /></UiConfirmDialog>
  </div>
</template>

<style scoped>
.integrations-page {
  display: grid;
  gap: 24px;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 16px 64px;
  box-sizing: border-box;
}
.integrations-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
h1,
h2,
h3,
p {
  margin: 0;
}
h1 {
  font-size: var(--font-size-xl);
  font-weight: 700;
}
h2 {
  font-size: var(--font-size-lg);
  font-weight: 650;
  overflow-wrap: anywhere;
}
h3 {
  font-size: var(--font-size-md);
  font-weight: 650;
}
p {
  color: var(--color-ink-body);
  max-width: 70ch;
}
.integrations-page__header p {
  margin-top: 8px;
}
.integrations-page__workspace {
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(0, 2fr);
  gap: 24px;
  align-items: start;
}
.integrations-page__applications,
.integrations-page__detail,
.integrations-page__form {
  display: grid;
  gap: 16px;
  min-width: 0;
}
.integrations-page__app {
  display: grid;
  gap: 6px;
  text-align: left;
  padding: 12px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  cursor: pointer;
  overflow-wrap: anywhere;
}
.integrations-page__app:hover {
  background: var(--color-surface-inset);
}
.integrations-page__app[aria-pressed='true'] {
  background: var(--color-brand-amber-soft);
  border-color: var(--color-action-primary);
}
.integrations-page__app span {
  font-size: var(--font-size-xs);
  color: var(--color-ink-body);
}
.integrations-page__actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.integrations-page__keys {
  list-style: none;
  padding: 0;
  margin: 0;
}
.integrations-page__keys > li {
  display: grid;
  gap: 12px;
  padding-block: 20px;
  border-top: 1px solid var(--color-border-soft);
  overflow-wrap: anywhere;
}
.integrations-page__keys > li > button {
  justify-self: start;
}
dl {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 32px;
  margin: 0;
  font-size: var(--font-size-sm);
}
dt {
  color: var(--color-ink-body);
}
dd {
  margin: 4px 0 0;
  font-variant-numeric: tabular-nums;
}
.integrations-page__scopes {
  padding-left: 20px;
  font-size: var(--font-size-sm);
}
.integrations-page__form input:not([type='checkbox']),
textarea {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: 10px 12px;
  background: var(--color-surface);
  color: var(--color-ink-strong);
}
textarea {
  resize: vertical;
  overflow-wrap: anywhere;
  font-family: monospace;
}
fieldset {
  border: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
legend {
  margin-bottom: 8px;
  font-weight: 650;
}
.integrations-page__checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
}
.integrations-page__checkbox input {
  accent-color: var(--color-action-primary);
  width: 18px;
  height: 18px;
}
@media (max-width: 760px) {
  .integrations-page__workspace {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
