<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Person } from '~/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const id = route.params.id as string
const headers = useRequestHeaders(['cookie'])
const photoFileRef = ref<HTMLInputElement>()

const { data: person, status: personStatus, refresh } = useFetch<Person>(`/api/persons/${id}`, {
  headers: headers as Record<string, string>,
  default: () => null as Person | null
})

const { isLockedByOther, lockOwner } = useLocks(computed(() => id))

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

function toDateInput(date?: string | null) {
  if (!date) return null
  return new Date(date).toISOString().split('T')[0]
}

const state = reactive<Partial<Schema>>({
  firstName: '',
  lastName: '',
  sex: 'M',
  birthDate: null,
  deathDate: null,
  birthPlace: '',
  deathPlace: '',
  photo: '',
  notes: ''
})

// Initialise le formulaire dès que les données arrivent
watch(person, (p) => {
  if (!p) return
  state.firstName = p.firstName
  state.lastName = p.lastName || ''
  state.sex = p.sex
  state.birthDate = toDateInput(p.birthDate)
  state.deathDate = toDateInput(p.deathDate)
  state.birthPlace = p.birthPlace || ''
  state.deathPlace = p.deathPlace || ''
  state.photo = p.photo || ''
  state.notes = p.notes || ''
}, { immediate: true })

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
    await $fetch(`/api/persons/${id}`, {
      method: 'PUT',
      body: event.data
    })
    toast.add({ title: 'Personne mise à jour', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', description: 'Impossible de modifier la personne', color: 'error' })
  } finally {
    loading.value = false
  }
}

async function onDelete() {
  try {
    await $fetch(`/api/persons/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Personne supprimée', color: 'success' })
    router.push('/persons')
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  }
}
</script>

<template>
  <UDashboardPanel id="person-detail">
    <template #header>
      <UDashboardNavbar :title="`${person?.firstName} ${person?.lastName || ''}`">
        <template #leading>
          <UButton
            color="neutral"
            icon="i-lucide-arrow-left"
            to="/persons"
            variant="ghost"
          />
        </template>

        <template #right>
          <UButton
            color="error"
            icon="i-lucide-trash"
            label="Supprimer"
            variant="soft"
            @click="onDelete"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="personStatus === 'pending'" class="flex justify-center py-16">
        <UIcon class="size-8 text-primary animate-spin" name="i-lucide-loader-2" />
      </div>
      <div v-else-if="!person" class="flex flex-col items-center justify-center gap-4 py-16">
        <UIcon class="size-12 text-dimmed" name="i-lucide-user-x" />
        <p class="text-dimmed">
          Personne introuvable
        </p>
        <UButton
          color="neutral"
          label="Retour"
          to="/persons"
          variant="soft"
        />
      </div>
      <div v-else class="max-w-2xl mx-auto p-6">
        <UAlert
          v-if="isLockedByOther"
          :description="`Cette ressource est actuellement en cours de modification par ${lockOwner}.`"
          class="mb-6"
          color="warning"
          icon="i-lucide-lock"
          title="Ressource verrouillée"
        />
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
              :disabled="isLockedByOther"
              :loading="loading"
              label="Enregistrer"
              type="submit"
            />
          </div>
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
