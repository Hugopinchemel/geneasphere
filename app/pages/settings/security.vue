<script setup lang="ts">
import * as z from 'zod'
import type { FormError } from '@nuxt/ui'

const toast = useToast()
const { clear } = useUserSession()
const savingPassword = ref(false)
const deletingAccount = ref(false)

const passwordSchema = z.object({
  currentPassword: z.string().min(8, 'Must be at least 8 characters'),
  newPassword: z.string().min(8, 'Must be at least 8 characters')
})

type PasswordSchema = z.infer<typeof passwordSchema>

const passwordForm = reactive<Partial<PasswordSchema>>({
  currentPassword: '',
  newPassword: ''
})

const validate = (state: Partial<PasswordSchema>): FormError[] => {
  const errors: FormError[] = []
  if (state.currentPassword && state.newPassword && state.currentPassword === state.newPassword) {
    errors.push({ name: 'newPassword', message: 'Passwords must be different' })
  }
  return errors
}

async function onPasswordSubmit() {
  savingPassword.value = true
  try {
    await $fetch('/api/auth/password', {
      method: 'PUT',
      body: { current: passwordForm.currentPassword, new: passwordForm.newPassword }
    })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    toast.add({ title: 'Success', description: 'Password updated.', icon: 'i-lucide-check', color: 'success' })
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    toast.add({ title: 'Error', description: e?.data?.statusMessage || 'Failed to update password', color: 'error' })
  } finally {
    savingPassword.value = false
  }
}

async function onDeleteAccount() {
  deletingAccount.value = true
  try {
    await $fetch('/api/auth/account', { method: 'DELETE' })
    await clear()
    await navigateTo('/login')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    toast.add({ title: 'Error', description: e?.data?.statusMessage || 'Failed to delete account', color: 'error' })
    deletingAccount.value = false
  }
}
</script>

<template>
  <UPageCard
    title="Password"
    description="Confirm your current password before setting a new one."
    variant="subtle"
  >
    <UForm
      :schema="passwordSchema"
      :state="passwordForm"
      :validate="validate"
      class="flex flex-col gap-4 max-w-xs"
      @submit="onPasswordSubmit"
    >
      <UFormField name="currentPassword">
        <UInput
          v-model="passwordForm.currentPassword"
          type="password"
          placeholder="Current password"
          class="w-full"
        />
      </UFormField>

      <UFormField name="newPassword">
        <UInput
          v-model="passwordForm.newPassword"
          type="password"
          placeholder="New password"
          class="w-full"
        />
      </UFormField>

      <UButton label="Update" class="w-fit" type="submit" :loading="savingPassword" />
    </UForm>
  </UPageCard>

  <UPageCard
    title="Account"
    description="No longer want to use our service? You can delete your account here. This action is not reversible. All information related to this account will be deleted permanently."
    class="bg-linear-to-tl from-error/10 from-5% to-default"
  >
    <template #footer>
      <UButton label="Delete account" color="error" :loading="deletingAccount" @click="onDeleteAccount" />
    </template>
  </UPageCard>
</template>
