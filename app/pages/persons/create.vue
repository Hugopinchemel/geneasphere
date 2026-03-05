<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { MatrimonialNode, Person } from '~/types'

const toast = useToast()
const router = useRouter()
const headers = useRequestHeaders(['cookie'])
const photoFileRef = ref<HTMLInputElement>()

// ─── Affiliation directe ─────────────────────────────────────────────────────
const showAffiliationModal = ref(false)
const createdPerson = ref<Person | null>(null)

const { data: existingNodes } = useFetch<MatrimonialNode[]>('/api/matrimonial-nodes', {
  headers: headers as Record<string, string>,
  default: () => [] as MatrimonialNode[]
})

const affiliationMode = ref<'existing' | 'new'>('existing')
const selectedNodeId = ref<string>('')
const affiliationRole = ref<'parent' | 'child'>('child')
const affiliationLinkType = ref<'biologique' | 'adoption' | 'gpa'>('biologique')
const affiliating = ref(false)

const nodeOptions = computed(() =>
  (existingNodes.value ?? []).map((n) => {
    const parentNames = (n.parents as Person[])
      .map(p => (typeof p === 'object' ? `${p.firstName} ${p.lastName}` : p))
      .join(' & ') || 'Sans parents connus'
    return { label: `${parentNames} (${n.status})`, value: n._id }
  })
)

async function doAffiliate() {
  if (!createdPerson.value) return
  affiliating.value = true
  try {
    if (affiliationMode.value === 'existing' && selectedNodeId.value) {
      const node = existingNodes.value?.find(n => n._id === selectedNodeId.value)
      if (!node) return

      // Construire le body de mise à jour
      const parents = (node.parents as (string | Person)[]).map(p => (typeof p === 'object' ? p._id : p))
      const children = (node.children as { person: string | Person, linkType: string }[]).map(c => ({
        person: typeof c.person === 'object' ? (c.person as Person)._id : c.person,
        linkType: c.linkType
      }))

      if (affiliationRole.value === 'parent') {
        if (parents.length >= 2) {
          toast.add({ title: 'Ce nœud a déjà 2 parents', color: 'error' })
          return
        }
        parents.push(createdPerson.value._id)
      } else {
        children.push({ person: createdPerson.value._id, linkType: affiliationLinkType.value })
      }

      await $fetch(`/api/matrimonial-nodes/${selectedNodeId.value}`, {
        method: 'PUT',
        body: { ...node, parents, children }
      })
      toast.add({ title: 'Affiliation effectuée', color: 'success' })
    } else {
      // Créer un nouveau nœud avec la personne
      const body = affiliationRole.value === 'parent'
        ? { status: 'inconnu', parents: [createdPerson.value._id], children: [] }
        : { status: 'inconnu', parents: [], children: [{ person: createdPerson.value._id, linkType: affiliationLinkType.value }] }
      await $fetch('/api/matrimonial-nodes', { method: 'POST', body })
      toast.add({ title: 'Nouveau nœud matrimonial créé', color: 'success' })
    }
    showAffiliationModal.value = false
    await router.push('/persons')
  } catch {
    toast.add({ title: 'Erreur lors de l\'affiliation', color: 'error' })
  } finally {
    affiliating.value = false
  }
}

function skipAffiliation() {
  showAffiliationModal.value = false
  router.push('/persons')
}

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
    const person = await $fetch<Person>('/api/persons', {
      method: 'POST',
      body: event.data
    })
    toast.add({ title: 'Personne créée avec succès', color: 'success' })
    createdPerson.value = person
    showAffiliationModal.value = true
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

  <!-- Modal d'affiliation directe -->
  <UModal v-model:open="showAffiliationModal" :dismissible="false" title="Affilier la personne">
    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-muted">
          <span class="font-semibold text-highlighted">{{ createdPerson?.firstName }} {{ createdPerson?.lastName }}</span>
          a été créé(e). Voulez-vous l'affilier maintenant à un nœud matrimonial ?
        </p>

        <!-- Rôle -->
        <UFormField label="Rôle dans le nœud">
          <USelect
            v-model="affiliationRole"
            :items="[{ label: 'Enfant', value: 'child' }, { label: 'Parent', value: 'parent' }]"
            class="w-full"
          />
        </UFormField>

        <!-- Type de lien (uniquement si enfant) -->
        <UFormField v-if="affiliationRole === 'child'" label="Type de lien">
          <USelect
            v-model="affiliationLinkType"
            :items="[{ label: 'Biologique', value: 'biologique' }, { label: 'Adoption', value: 'adoption' }, { label: 'GPA', value: 'gpa' }]"
            class="w-full"
          />
        </UFormField>

        <!-- Mode : existant ou nouveau -->
        <UFormField label="Nœud matrimonial">
          <USelect
            v-model="affiliationMode"
            :items="[{ label: 'Ajouter à un nœud existant', value: 'existing' }, { label: 'Créer un nouveau nœud', value: 'new' }]"
            class="w-full"
          />
        </UFormField>

        <!-- Sélection du nœud existant -->
        <UFormField v-if="affiliationMode === 'existing'" label="Choisir le nœud">
          <USelect
            v-model="selectedNodeId"
            :items="nodeOptions"
            class="w-full"
            placeholder="Sélectionner un nœud…"
          />
          <p v-if="nodeOptions.length === 0" class="text-sm text-dimmed mt-1">
            Aucun nœud existant. Un nouveau nœud sera créé.
          </p>
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          label="Passer"
          variant="subtle"
          @click="skipAffiliation"
        />
        <UButton
          :disabled="affiliationMode === 'existing' && !selectedNodeId && nodeOptions.length > 0"
          :loading="affiliating"
          label="Affilier"
          @click="doAffiliate"
        />
      </div>
    </template>
  </UModal>
</template>
