<script lang="ts" setup>
import * as z from 'zod'
import type {FormError} from '@nuxt/ui'

const toast = useToast()
const {clear} = useUserSession()
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
    errors.push({name: 'newPassword', message: 'Passwords must be different'})
  }
  return errors
}

async function onPasswordSubmit() {
  savingPassword.value = true
  try {
    await $fetch('/api/auth/password', {
      method: 'PUT',
      body: {current: passwordForm.currentPassword, new: passwordForm.newPassword}
    })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    toast.add({title: 'Success', description: 'Password updated.', icon: 'i-lucide-check', color: 'success'})
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    toast.add({title: 'Error', description: e?.data?.statusMessage || 'Failed to update password', color: 'error'})
  } finally {
    savingPassword.value = false
  }
}

async function onDeleteAccount() {
  deletingAccount.value = true
  try {
    await $fetch('/api/auth/account', {method: 'DELETE'})
    await clear()
    await navigateTo('/login')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    toast.add({title: 'Error', description: e?.data?.statusMessage || 'Failed to delete account', color: 'error'})
    deletingAccount.value = false
  }
}
</script>

<template>
  <UPageCard
    description="Confirm your current password before setting a new one."
    title="Password"
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
          class="w-full"
          placeholder="Current password"
          type="password"
        />
      </UFormField>

      <UFormField name="newPassword">
        <UInput
          v-model="passwordForm.newPassword"
          class="w-full"
          placeholder="New password"
          type="password"
        />
      </UFormField>

      <UButton
        :loading="savingPassword"
        class="w-fit"
        label="Update"
        type="submit"
      />
    </UForm>
  </UPageCard>

  <UPageCard
    class="bg-linear-to-tl from-error/10 from-5% to-default"
    description="No longer want to use our service? You can delete your account here. This action is not reversible. All information related to this account will be deleted permanently."
    title="Account"
  >
    <template #footer>
      <UButton
        :loading="deletingAccount"
        color="error"
        label="Delete account"
        @click="onDeleteAccount"
      />
    </template>
  </UPageCard>
</template>
