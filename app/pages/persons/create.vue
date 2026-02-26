<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const toast = useToast()
const router = useRouter()
const photoFileRef = ref<HTMLInputElement>()

const schema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().optional().default(''),
  sex: z.enum(['M', 'F', 'Autre']),
  birthDate: z.string().optional().nullable(),
  deathDate: z.string().optional().nullable(),
  birthPlace: z.string().optional().default(''),
  deathPlace: z.string().optional().default(''),
  photo: z.string().optional().default(''),
  notes: z.string().optional().default('')
})

type Schema = z.infer<typeof schema>

const state = reactive<Partial<Schema>>({
  firstName: '',
  lastName: '',
  sex: undefined,
  birthDate: null,
  deathDate: null,
  birthPlace: '',
  deathPlace: '',
  photo: '',
  notes: ''
})

const sexOptions = [
  { label: 'Homme', value: 'M' },
  { label: 'Femme', value: 'F' },
  { label: 'Autre', value: 'Autre' }
]

const loading = ref(false)
const uploading = ref(false)

async function onPhotoChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]!
  if (file.size > 5 * 1024 * 1024) {
    toast.add({ title: 'Erreur', description: 'Le fichier est trop volumineux (max 5 Mo)', color: 'error' })
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
    state.photo = result.url
    toast.add({ title: 'Photo uploadée', color: 'success' })
  } catch {
    toast.add({ title: 'Erreur', description: 'Impossible d\'uploader la photo', color: 'error' })
  } finally {
    uploading.value = false
  }
}

function onPhotoClick() {
  photoFileRef.value?.click()
}

function removePhoto() {
  state.photo = ''
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await $fetch('/api/persons', {
      method: 'POST',
      body: event.data
    })
    toast.add({ title: 'Personne créée avec succès', color: 'success' })
    router.push('/persons')
  } catch {
    toast.add({ title: 'Erreur', description: 'Impossible de créer la personne', color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="persons-create">
    <template #header>
      <UDashboardNavbar title="Nouvelle personne">
        <template #leading>
          <UButton
            color="neutral"
            icon="i-lucide-arrow-left"
            to="/persons"
            variant="ghost"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-2xl mx-auto p-6">
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-6"
          @submit="onSubmit"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Prénom" name="firstName" required>
              <UInput v-model="state.firstName" class="w-full" placeholder="Jean" />
            </UFormField>

            <UFormField label="Nom" name="lastName">
              <UInput v-model="state.lastName" class="w-full" placeholder="Dupont" />
            </UFormField>
          </div>

          <UFormField label="Sexe" name="sex" required>
            <USelect
              v-model="state.sex"
              :items="sexOptions"
              class="w-full"
              placeholder="Sélectionner..."
            />
          </UFormField>

          <!-- Photo -->
          <UFormField
            class="flex max-sm:flex-col justify-between sm:items-center gap-4"
            description="JPG, PNG, GIF ou WebP. 5 Mo max."
            label="Photo"
            name="photo"
          >
            <div class="flex flex-wrap items-center gap-3">
              <UAvatar
                :alt="`${state.firstName} ${state.lastName}`"
                :src="state.photo || undefined"
                size="lg"
              />
              <UButton
                :loading="uploading"
                color="neutral"
                label="Choisir"
                @click="onPhotoClick"
              />
              <UButton
                v-if="state.photo"
                color="error"
                label="Supprimer"
                variant="soft"
                @click="removePhoto"
              />
              <input
                ref="photoFileRef"
                accept=".jpg, .jpeg, .png, .gif, .webp"
                class="hidden"
                type="file"
                @change="onPhotoChange"
              >
            </div>
          </UFormField>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Date de naissance" name="birthDate">
              <UInput v-model="state.birthDate" class="w-full" type="date" />
            </UFormField>

            <UFormField label="Lieu de naissance" name="birthPlace">
              <UInput v-model="state.birthPlace" class="w-full" placeholder="Paris, France" />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Date de décès" name="deathDate">
              <UInput v-model="state.deathDate" class="w-full" type="date" />
            </UFormField>

            <UFormField label="Lieu de décès" name="deathPlace">
              <UInput v-model="state.deathPlace" class="w-full" placeholder="Lyon, France" />
            </UFormField>
          </div>

          <UFormField label="Notes" name="notes">
            <UTextarea
              v-model="state.notes"
              :rows="4"
              class="w-full"
              placeholder="Informations supplémentaires..."
            />
          </UFormField>

          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              label="Annuler"
              to="/persons"
              variant="subtle"
            />
            <UButton
              :loading="loading"
              label="Créer"
              type="submit"
            />
          </div>
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
