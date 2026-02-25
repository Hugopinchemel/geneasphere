<script lang="ts" setup>
import * as z from 'zod'
import type {FormSubmitEvent} from '@nuxt/ui'
import type {MatrimonialNode, Person} from '~/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const id = route.params.id as string
const headers = useRequestHeaders(['cookie'])

const {data: node, refresh} = await useFetch<MatrimonialNode>(`/api/matrimonial-nodes/${id}`, {headers})
const {data: persons} = await useFetch<Person[]>('/api/persons', {headers})

if (!node.value) {
  throw createError({statusCode: 404, statusMessage: 'Nœud introuvable'})
}

const personOptions = computed(() =>
  (persons.value || []).map(p => ({
    label: `${p.firstName} ${p.lastName || ''}`.trim(),
    value: p._id
  }))
)

const statusOptions = [
  {label: 'Marié(e)', value: 'marié'},
  {label: 'Divorcé(e)', value: 'divorcé'},
  {label: 'Pacsé(e)', value: 'pacsé'},
  {label: 'Union libre', value: 'union_libre'},
  {label: 'Inconnu', value: 'inconnu'}
]

const linkTypeOptions = [
  {label: 'Biologique', value: 'biologique'},
  {label: 'Adoption', value: 'adoption'},
  {label: 'GPA', value: 'gpa'}
]

const schema = z.object({
  status: z.enum(['marié', 'divorcé', 'pacsé', 'union_libre', 'inconnu']),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  parents: z.array(z.string()).max(2, 'Maximum 2 parents'),
  children: z.array(z.object({
    person: z.string(),
    linkType: z.enum(['biologique', 'adoption', 'gpa'])
  }))
})

type Schema = z.infer<typeof schema>

function toDateInput(date?: string | null) {
  if (!date) return null
  return new Date(date).toISOString().split('T')[0]
}

function getPersonId(p: string | Person): string {
  return typeof p === 'string' ? p : p._id
}

const state = reactive({
  status: node.value.status,
  startDate: toDateInput(node.value.startDate),
  endDate: toDateInput(node.value.endDate),
  parents: node.value.parents.map(p => getPersonId(p)),
  children: node.value.children.map(c => ({
    person: getPersonId(c.person),
    linkType: c.linkType
  }))
})

function addChild() {
  state.children.push({person: '', linkType: 'biologique'})
}

function removeChild(index: number) {
  state.children.splice(index, 1)
}

function addParent() {
  if (state.parents.length < 2) {
    state.parents.push('')
  }
}

function removeParent(index: number) {
  state.parents.splice(index, 1)
}

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await $fetch(`/api/matrimonial-nodes/${id}`, {
      method: 'PUT',
      body: event.data
    })
    toast.add({title: 'Nœud matrimonial mis à jour', color: 'success'})
    await refresh()
  } catch {
    toast.add({title: 'Erreur', description: 'Impossible de modifier le nœud', color: 'error'})
  } finally {
    loading.value = false
  }
}

async function onDelete() {
  try {
    await $fetch(`/api/matrimonial-nodes/${id}`, {method: 'DELETE'})
    toast.add({title: 'Nœud supprimé', color: 'success'})
    router.push('/matrimonial-nodes')
  } catch {
    toast.add({title: 'Erreur lors de la suppression', color: 'error'})
  }
}
</script>

<template>
  <UDashboardPanel id="matrimonial-edit">
    <template #header>
      <UDashboardNavbar title="Modifier le nœud matrimonial">
        <template #leading>
          <UButton
            color="neutral"
            icon="i-lucide-arrow-left"
            to="/matrimonial-nodes"
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
      <div class="max-w-2xl mx-auto p-6">
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-6"
          @submit="onSubmit"
        >
          <UFormField label="Statut" name="status" required>
            <USelect
              v-model="state.status"
              :items="statusOptions"
              class="w-full"
              placeholder="Sélectionner le statut..."
            />
          </UFormField>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Date de début" name="startDate">
              <UInput v-model="state.startDate" class="w-full" type="date"/>
            </UFormField>

            <UFormField label="Date de fin" name="endDate">
              <UInput v-model="state.endDate" class="w-full" type="date"/>
            </UFormField>
          </div>

          <!-- Parents -->
          <fieldset class="space-y-3">
            <legend class="text-sm font-medium text-default flex items-center gap-2">
              Parents (0 à 2)
              <UButton
                v-if="state.parents.length < 2"
                icon="i-lucide-plus"
                size="xs"
                variant="soft"
                @click="addParent"
              />
            </legend>
            <div v-for="(_parent, index) in state.parents" :key="index" class="flex gap-2 items-end">
              <UFormField :label="`Parent ${index + 1}`" :name="`parents[${index}]`" class="flex-1">
                <USelect
                  v-model="state.parents[index]"
                  :items="personOptions"
                  class="w-full"
                  placeholder="Sélectionner une personne..."
                />
              </UFormField>
              <UButton
                color="error"
                icon="i-lucide-x"
                size="sm"
                variant="ghost"
                @click="removeParent(index)"
              />
            </div>
            <p v-if="!state.parents.length" class="text-dimmed text-sm">
              Aucun parent ajouté (parent(s) inconnu(s))
            </p>
          </fieldset>

          <!-- Enfants -->
          <fieldset class="space-y-3">
            <legend class="text-sm font-medium text-default flex items-center gap-2">
              Enfants
              <UButton
                icon="i-lucide-plus"
                size="xs"
                variant="soft"
                @click="addChild"
              />
            </legend>
            <div v-for="(_child, index) in state.children" :key="index" class="flex gap-2 items-end">
              <UFormField :label="`Enfant ${index + 1}`" :name="`children[${index}].person`" class="flex-1">
                <USelect
                  v-model="state.children[index]!.person"
                  :items="personOptions"
                  class="w-full"
                  placeholder="Sélectionner une personne..."
                />
              </UFormField>
              <UFormField :name="`children[${index}].linkType`" class="w-40" label="Type de lien">
                <USelect
                  v-model="state.children[index]!.linkType"
                  :items="linkTypeOptions"
                  class="w-full"
                />
              </UFormField>
              <UButton
                color="error"
                icon="i-lucide-x"
                size="sm"
                variant="ghost"
                @click="removeChild(index)"
              />
            </div>
            <p v-if="!state.children.length" class="text-dimmed text-sm">
              Aucun enfant ajouté
            </p>
          </fieldset>

          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              label="Annuler"
              to="/matrimonial-nodes"
              variant="subtle"
            />
            <UButton
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
