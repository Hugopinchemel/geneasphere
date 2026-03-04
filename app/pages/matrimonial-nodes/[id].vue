<script lang="ts" setup>
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { MatrimonialNode, Person } from '~/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const id = route.params.id as string
const headers = useRequestHeaders(['cookie'])

const { data: node, status: nodeStatus, refresh } = useFetch<MatrimonialNode | null>(`/api/matrimonial-nodes/${id}`, {
  headers: headers as Record<string, string>,
  default: () => null
})
const { data: persons } = useFetch<Person[]>('/api/persons', {
  headers: headers as Record<string, string>,
  default: () => [] as Person[]
})

const { data: allNodes } = useFetch<MatrimonialNode[]>('/api/matrimonial-nodes', {
  headers: headers as Record<string, string>,
  default: () => [] as MatrimonialNode[]
})

const { isLockedByOther, lockOwner } = useLocks(computed(() => id))

function toDateInput(date?: string | null) {
  if (!date) return null
  return new Date(date).toISOString().split('T')[0]
}

function getPersonId(p: string | Person): string {
  return typeof p === 'string' ? p : p._id
}

const state = reactive({
  status: 'inconnu' as MatrimonialNode['status'],
  startDate: null as string | null,
  endDate: null as string | null,
  parents: [] as string[],
  children: [] as { person: string, linkType: 'biologique' | 'adoption' | 'gpa' }[]
})

watch(node, (n) => {
  if (!n) return
  const mn = n as MatrimonialNode
  state.status = mn.status
  state.startDate = toDateInput(mn.startDate)
  state.endDate = toDateInput(mn.endDate)
  state.parents = mn.parents.map(p => getPersonId(p as string | Person))
  state.children = mn.children.map(c => ({
    person: getPersonId(c.person as string | Person),
    linkType: c.linkType
  }))
}, { immediate: true })

const personOptions = computed(() =>
  (persons.value || []).map(p => ({
    label: `${p.firstName} ${p.lastName || ''}`.trim(),
    value: p._id
  }))
)

const statusOptions = [
  { label: 'Marié(e)', value: 'married' },
  { label: 'Divorcé(e)', value: 'divorced' },
  { label: 'Pacsé(e)', value: 'pacsed' },
  { label: 'Union', value: 'union' },
  { label: 'Union libre', value: 'union_libre' },
  { label: 'Inconnu', value: 'inconnu' }
]

const linkTypeOptions = [
  { label: 'Biologique', value: 'biologique' },
  { label: 'Adoption', value: 'adoption' },
  { label: 'GPA', value: 'gpa' }
]

const schema = z.object({
  status: z.enum(['married', 'divorced', 'pacsed', 'union', 'union_libre', 'inconnu']),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  parents: z.array(z.string()).max(2, 'Maximum 2 parents').refine(
    (parents) => {
      const ids = parents.filter(id => id !== '')
      return ids.length === new Set(ids).size
    },
    { message: 'Un parent ne peut pas apparaître deux fois' }
  ),
  children: z.array(z.object({
    person: z.string(),
    linkType: z.enum(['biologique', 'adoption', 'gpa'])
  })).refine(
    (children) => {
      const ids = children.map(c => c.person).filter(id => id !== '')
      return ids.length === new Set(ids).size
    },
    { message: 'Un enfant ne peut pas apparaître deux fois' }
  )
}).refine(
  (data) => {
    const parentIds = data.parents.filter(p => p !== '')
    const childIds = data.children.map(c => c.person).filter(p => p !== '')

    // Check same node conflict
    if (parentIds.some(p => childIds.includes(p))) {
      return false
    }

    // Multi-node consistency
    const nodes = allNodes.value || []
    for (const parentId of parentIds) {
      const ancestors = getAncestors(parentId, nodes)
      if (childIds.some(cId => ancestors.has(cId))) {
        return false
      }
    }

    for (const childId of childIds) {
      const descendants = getDescendants(childId, nodes)
      if (parentIds.some(pId => descendants.has(pId))) {
        return false
      }
    }

    return true
  },
  { message: 'Incohérence dans la hiérarchie (cycle détecté ou personne déjà ancêtre/descendant)' }
)

type Schema = z.infer<typeof schema>

function getFilteredPersonOptions(currentValue: string, type: 'parent' | 'child') {
  const selectedParentIds = state.parents?.filter(p => p && p !== currentValue) || []
  const selectedChildIds = state.children?.map(c => c.person).filter(p => p && p !== currentValue) || []
  const allSelectedInNode = new Set([...selectedParentIds, ...selectedChildIds])

  return personOptions.value.filter((opt) => {
    if (allSelectedInNode.has(opt.value)) return false

    // Multi-node consistency:
    const nodes = allNodes.value || []

    if (type === 'child') {
      // Selected child cannot be an ancestor of any current parent in this node
      for (const parentId of selectedParentIds) {
        if (parentId === opt.value) return false
        const ancestors = getAncestors(parentId, nodes)
        if (ancestors.has(opt.value)) return false
      }
    } else {
      // Selected parent cannot be a descendant of any current child in this node
      for (const childId of selectedChildIds) {
        if (childId === opt.value) return false
        const descendants = getDescendants(childId, nodes)
        if (descendants.has(opt.value)) return false
      }
    }

    return true
  })
}

function getAncestors(personId: string, nodes: MatrimonialNode[]): Set<string> {
  const ancestors = new Set<string>()
  const stack = [personId]
  while (stack.length > 0) {
    const currentId = stack.pop()!
    for (const node of nodes) {
      if (node._id === id) continue // Skip the node being edited
      const isChild = node.children.some(c => (typeof c.person === 'string' ? c.person : c.person._id) === currentId)
      if (isChild) {
        for (const parent of node.parents) {
          const pId = typeof parent === 'string' ? parent : parent._id
          if (!ancestors.has(pId)) {
            ancestors.add(pId)
            stack.push(pId)
          }
        }
      }
    }
  }
  return ancestors
}

function getDescendants(personId: string, nodes: MatrimonialNode[]): Set<string> {
  const descendants = new Set<string>()
  const stack = [personId]
  while (stack.length > 0) {
    const currentId = stack.pop()!
    for (const node of nodes) {
      if (node._id === id) continue // Skip the node being edited
      const isParent = node.parents.some(p => (typeof p === 'string' ? p : p._id) === currentId)
      if (isParent) {
        for (const child of node.children) {
          const cId = typeof child.person === 'string' ? child.person : child.person._id
          if (!descendants.has(cId)) {
            descendants.add(cId)
            stack.push(cId)
          }
        }
      }
    }
  }
  return descendants
}

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await $fetch(`/api/matrimonial-nodes/${id}`, { method: 'PUT', body: event.data })
    toast.add({ title: 'Nœud matrimonial mis à jour', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', description: 'Impossible de modifier le nœud', color: 'error' })
  } finally {
    loading.value = false
  }
}

async function onDelete() {
  try {
    await $fetch(`/api/matrimonial-nodes/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Nœud supprimé', color: 'success' })
    await router.push('/matrimonial-nodes')
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
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
      <div v-if="nodeStatus === 'pending'" class="flex justify-center py-16">
        <UIcon class="size-8 text-primary animate-spin" name="i-lucide-loader-2" />
      </div>
      <div
        v-else-if="!node"
        class="flex flex-col items-center justify-center gap-4 py-16"
      >
        <UIcon class="size-12 text-dimmed" name="i-lucide-heart-off" />
        <p class="text-dimmed">
          Nœud introuvable
        </p>
        <UButton
          color="neutral"
          label="Retour"
          to="/matrimonial-nodes"
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
              <UInput v-model="state.startDate" class="w-full" type="date" />
            </UFormField>
            <UFormField label="Date de fin" name="endDate">
              <UInput v-model="state.endDate" class="w-full" type="date" />
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
            <div
              v-for="index in state.parents.length"
              :key="index"
              class="flex gap-2 items-end"
            >
              <UFormField :label="`Parent ${index}`" :name="`parents[${index - 1}]`" class="flex-1">
                <USelect
                  v-model="state.parents[index - 1]"
                  :items="getFilteredPersonOptions(state.parents[index - 1]!, 'parent')"
                  class="w-full"
                  placeholder="Sélectionner une personne..."
                />
              </UFormField>
              <UButton
                color="error"
                icon="i-lucide-x"
                size="sm"
                variant="ghost"
                @click="removeParent(index - 1)"
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
            <div
              v-for="index in state.children.length"
              :key="index"
              class="flex gap-2 items-end"
            >
              <UFormField :label="`Enfant ${index}`" :name="`children[${index - 1}].person`" class="flex-1">
                <USelect
                  v-model="state.children[index - 1]!.person"
                  :items="getFilteredPersonOptions(state.children[index - 1]!.person, 'child')"
                  class="w-full"
                  placeholder="Sélectionner une personne..."
                />
              </UFormField>
              <UFormField :name="`children[${index - 1}].linkType`" class="w-40" label="Type de lien">
                <USelect v-model="state.children[index - 1]!.linkType" :items="linkTypeOptions" class="w-full" />
              </UFormField>
              <UButton
                color="error"
                icon="i-lucide-x"
                size="sm"
                variant="ghost"
                @click="removeChild(index - 1)"
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
