<script lang="ts" setup>
import * as z from 'zod'
import type {FormSubmitEvent} from '@nuxt/ui'

const fileRef = ref<HTMLInputElement>()
const toast = useToast()
const {fetch: fetchSession} = useUserSession()

const profileSchema = z.object({
  name: z.string().min(2, 'Too short'),
  email: z.string().email('Invalid email'),
  avatar: z.string().optional(),
  bio: z.string().optional()
})

type ProfileSchema = z.infer<typeof profileSchema>

const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)

const profile = reactive<Partial<ProfileSchema>>({
  name: '',
  email: '',
  avatar: undefined,
  bio: undefined
})

onMounted(async () => {
  try {
    const data = await $fetch('/api/auth/profile')
    profile.name = data.name
    profile.email = data.email
    profile.avatar = data.avatar || undefined
    profile.bio = data.bio || undefined
  } catch {
    toast.add({title: 'Error', description: 'Failed to load profile', color: 'error'})
  } finally {
    loading.value = false
  }
})

async function onSubmit(event: FormSubmitEvent<ProfileSchema>) {
  saving.value = true
  try {
    await $fetch('/api/auth/profile', {
      method: 'PUT',
      body: event.data
    })
    await fetchSession()
    toast.add({
      title: 'Success',
      description: 'Your settings have been updated.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    toast.add({title: 'Error', description: e?.data?.statusMessage || 'Failed to update profile', color: 'error'})
  } finally {
    saving.value = false
  }
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]!
  if (file.size > 5 * 1024 * 1024) {
    toast.add({title: 'Erreur', description: 'Le fichier est trop volumineux (max 5 Mo)', color: 'error'})
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const result = await $fetch<{ url: string }>('/api/upload', {
      method: 'POST',
      body: formData
    })
    profile.avatar = result.url
    toast.add({title: 'Photo uploadée', color: 'success'})
  } catch {
    toast.add({title: 'Erreur', description: 'Impossible d\'uploader la photo', color: 'error'})
  } finally {
    uploading.value = false
  }
}

function onFileClick() {
  fileRef.value?.click()
}
</script>

<template>
  <UForm
    id="settings"
    :schema="profileSchema"
    :state="profile"
    @submit="onSubmit"
  >
    <UPageCard
      class="mb-4"
      description="These informations will be displayed publicly."
      orientation="horizontal"
      title="Profile"
      variant="naked"
    >
      <UButton
        :loading="saving"
        class="w-fit lg:ms-auto"
        color="neutral"
        form="settings"
        label="Save changes"
        type="submit"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <UFormField
        class="flex max-sm:flex-col justify-between items-start gap-4"
        description="Will appear on receipts, invoices, and other communication."
        label="Name"
        name="name"
        required
      >
        <UInput
          v-model="profile.name"
          autocomplete="off"
        />
      </UFormField>
      <USeparator/>
      <UFormField
        class="flex max-sm:flex-col justify-between items-start gap-4"
        description="Used to sign in, for email receipts and product updates."
        label="Email"
        name="email"
        required
      >
        <UInput
          v-model="profile.email"
          autocomplete="off"
          type="email"
        />
      </UFormField>
      <USeparator/>
      <UFormField
        class="flex max-sm:flex-col justify-between sm:items-center gap-4"
        description="JPG, GIF or PNG. 1MB Max."
        label="Avatar"
        name="avatar"
      >
        <div class="flex flex-wrap items-center gap-3">
          <UAvatar
            :alt="profile.name"
            :src="profile.avatar"
            size="lg"
          />
          <UButton
            :loading="uploading"
            color="neutral"
            label="Choose"
            @click="onFileClick"
          />
          <input
            ref="fileRef"
            accept=".jpg, .jpeg, .png, .gif"
            class="hidden"
            type="file"
            @change="onFileChange"
          >
        </div>
      </UFormField>
      <USeparator/>
      <UFormField
        :ui="{ container: 'w-full' }"
        class="flex max-sm:flex-col justify-between items-start gap-4"
        description="Brief description for your profile. URLs are hyperlinked."
        label="Bio"
        name="bio"
      >
        <UTextarea
          v-model="profile.bio"
          :rows="5"
          autoresize
          class="w-full"
        />
      </UFormField>
    </UPageCard>
  </UForm>
</template>
