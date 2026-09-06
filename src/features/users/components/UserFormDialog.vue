<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'

import type { CreateUserPayload, RoleOption, UpdateUserPayload, UserItem } from '../api/users.api'

const props = defineProps<{
  open: boolean
  user: UserItem | null
  roleOptions: RoleOption[]
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [payload: CreateUserPayload | UpdateUserPayload]
}>()

const isEdit = computed(() => Boolean(props.user))
const dialogTitle = computed(() => (isEdit.value ? `Edit Pengguna: ${props.user?.name}` : 'Tambah Pengguna Baru'))

interface FormState {
  name: string
  email: string
  password: string
  roles: string[]
  is_active: boolean
}

const form = reactive<FormState>({
  name: '',
  email: '',
  password: '',
  roles: [],
  is_active: true,
})

const clientErrors = reactive<Record<string, string>>({
  name: '',
  email: '',
  password: '',
  roles: '',
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      clientErrors.name = ''
      clientErrors.email = ''
      clientErrors.password = ''
      clientErrors.roles = ''

      if (props.user) {
        form.name = props.user.name
        form.email = props.user.email
        form.password = ''
        form.roles = [...props.user.roles]
        form.is_active = props.user.is_active ?? true
      } else {
        form.name = ''
        form.email = ''
        form.password = ''
        form.roles = props.roleOptions.length > 0 && props.roleOptions[0] ? [props.roleOptions[0].value] : []
        form.is_active = true
      }
    }
  },
  { immediate: true },
)

function toggleRole(roleValue: string) {
  const idx = form.roles.indexOf(roleValue)
  if (idx >= 0) {
    form.roles.splice(idx, 1)
  } else {
    form.roles.push(roleValue)
  }
}

function validate(): boolean {
  let valid = true
  clientErrors.name = ''
  clientErrors.email = ''
  clientErrors.password = ''
  clientErrors.roles = ''

  if (!form.name.trim()) {
    clientErrors.name = 'Nama lengkap wajib diisi.'
    valid = false
  }

  if (!form.email.trim()) {
    clientErrors.email = 'Alamat email wajib diisi.'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    clientErrors.email = 'Format alamat email tidak valid.'
    valid = false
  }

  if (!isEdit.value) {
    if (!form.password) {
      clientErrors.password = 'Kata sandi wajib diisi.'
      valid = false
    } else if (form.password.length < 8) {
      clientErrors.password = 'Kata sandi minimal 8 karakter.'
      valid = false
    }
  } else if (form.password && form.password.length < 8) {
    clientErrors.password = 'Kata sandi baru minimal 8 karakter.'
    valid = false
  }

  if (form.roles.length === 0) {
    clientErrors.roles = 'Pilih setidaknya satu role untuk pengguna ini.'
    valid = false
  }

  return valid
}

function handleSubmit() {
  if (!validate()) return

  if (isEdit.value) {
    const payload: UpdateUserPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      roles: [...form.roles],
      is_active: form.is_active,
    }
    if (form.password.trim()) {
      payload.password = form.password.trim()
    }
    emit('save', payload)
  } else {
    const payload: CreateUserPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      roles: [...form.roles],
      is_active: form.is_active,
    }
    emit('save', payload)
  }
}
</script>

<template>
  <UiDialog
    :open="open"
    :title="dialogTitle"
    width="md"
    @update:open="emit('update:open', $event)"
  >
    <form class="user-dialog__form" @submit.prevent="handleSubmit">
      <UiInlineAlert
        v-if="error"
        tone="error"
        title="Gagal menyimpan"
        class="user-dialog__alert"
      >
        <p>{{ error }}</p>
      </UiInlineAlert>

      <UiField
        label="Nama Lengkap"
        required
        :error="clientErrors.name"
      >
        <input
          v-model="form.name"
          type="text"
          placeholder="contoh: Ahmad Fauzi"
          class="user-dialog__input"
          data-testid="user-form-name"
        />
      </UiField>

      <UiField
        label="Alamat Email"
        required
        :error="clientErrors.email"
      >
        <input
          v-model="form.email"
          type="email"
          placeholder="contoh: ahmad@sysinfo.id"
          class="user-dialog__input"
          data-testid="user-form-email"
        />
      </UiField>

      <UiField
        :label="isEdit ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi'"
        :required="!isEdit"
        :error="clientErrors.password"
        :help="isEdit ? 'Kosongkan jika tidak ingin mengubah kata sandi pengguna.' : 'Minimal 8 karakter.'"
      >
        <input
          v-model="form.password"
          type="password"
          placeholder="••••••••"
          class="user-dialog__input"
          data-testid="user-form-password"
        />
      </UiField>

      <div class="user-dialog__field">
        <label class="user-dialog__label">
          Role & Kewenangan <span class="text-danger">*</span>
        </label>
        <div class="user-dialog__roles" role="group" aria-label="Role pengguna">
          <label
            v-for="opt in roleOptions"
            :key="opt.value"
            class="user-dialog__role-option"
            :class="{ 'user-dialog__role-option--selected': form.roles.includes(opt.value) }"
          >
            <input
              type="checkbox"
              :value="opt.value"
              :checked="form.roles.includes(opt.value)"
              class="user-dialog__role-checkbox"
              @change="toggleRole(opt.value)"
            />
            <span>{{ opt.label }}</span>
          </label>
        </div>
        <p v-if="clientErrors.roles" class="user-dialog__error-text">
          {{ clientErrors.roles }}
        </p>
      </div>

      <div class="user-dialog__field user-dialog__field--switch">
        <label class="user-dialog__switch-container">
          <input
            v-model="form.is_active"
            type="checkbox"
            class="user-dialog__switch-input"
            data-testid="user-form-status"
          />
          <span class="user-dialog__switch-slider" />
          <span class="user-dialog__switch-label">
            <strong>Status Akun Aktif</strong>
            <small>{{ form.is_active ? 'Pengguna dapat masuk dan menggunakan sistem.' : 'Akun dinonaktifkan sementara.' }}</small>
          </span>
        </label>
      </div>
    </form>

    <template #footer>
      <div class="user-dialog__footer">
        <UiButton
          type="button"
          variant="secondary"
          :disabled="loading"
          @click="emit('update:open', false)"
        >
          Batal
        </UiButton>
        <UiButton
          type="button"
          variant="primary"
          :loading="loading"
          loading-label="Menyimpan..."
          data-testid="user-form-submit"
          @click="handleSubmit"
        >
          {{ isEdit ? 'Simpan Perubahan' : 'Tambah Pengguna' }}
        </UiButton>
      </div>
    </template>
  </UiDialog>
</template>

<style scoped>
.user-dialog__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-dialog__alert {
  margin-bottom: 4px;
}

.user-dialog__input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-soft);
  background: var(--color-surface);
  color: var(--color-ink-strong);
  font-family: inherit;
  font-size: 0.875rem;
  transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
}

.user-dialog__input:focus {
  outline: none;
  border-color: var(--color-brand-amber);
  box-shadow: 0 0 0 3px var(--color-brand-amber-soft);
}

.user-dialog__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-dialog__label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-ink-strong);
}

.user-dialog__roles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-dialog__role-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 9999px;
  border: 1px solid var(--color-border-soft);
  background: var(--color-surface-inset);
  color: var(--color-ink-body);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.user-dialog__role-option:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-hover);
}

.user-dialog__role-option--selected {
  background: var(--color-brand-amber-soft);
  border-color: var(--color-brand-amber);
  color: var(--color-ink-strong);
  font-weight: 600;
}

.user-dialog__role-checkbox {
  width: 14px;
  height: 14px;
  accent-color: var(--color-brand-amber);
  cursor: pointer;
}

.user-dialog__error-text {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-danger-text);
}

.user-dialog__field--switch {
  margin-top: 4px;
  padding: 12px;
  border-radius: var(--radius-card);
  background: var(--color-surface-inset);
}

.user-dialog__switch-container {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.user-dialog__switch-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.user-dialog__switch-slider {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  background-color: var(--color-border-subtle);
  border-radius: 9999px;
  transition: background-color var(--transition-normal);
  flex-shrink: 0;
}

.user-dialog__switch-slider::before {
  content: "";
  position: absolute;
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: var(--color-surface);
  border-radius: 50%;
  transition: transform var(--transition-normal);
}

.user-dialog__switch-input:checked + .user-dialog__switch-slider {
  background-color: var(--color-brand-amber);
}

.user-dialog__switch-input:checked + .user-dialog__switch-slider::before {
  transform: translateX(18px);
}

.user-dialog__switch-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-dialog__switch-label strong {
  font-size: 0.8125rem;
  color: var(--color-ink-strong);
}

.user-dialog__switch-label small {
  font-size: 0.75rem;
  color: var(--color-ink-muted);
}

.user-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
}
</style>
