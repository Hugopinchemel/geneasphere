<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui'
import type { MatrimonialNode, Person } from '~/types'

const { isNotificationsSlideoverOpen } = useDashboard()

const items = [[{
  label: 'Ajouter une personne',
  icon: 'i-lucide-user-plus',
  to: '/persons/create'
}, {
  label: 'Ajouter un nœud matrimonial',
  icon: 'i-lucide-heart',
  to: '/matrimonial-nodes/create'
}]] satisfies DropdownMenuItem[][]

const headers = useRequestHeaders(['cookie'])

const { data: allPersons, status: personsStatus } = useFetch<Person[]>('/api/persons', {
  headers: headers as Record<string, string>,
  default: () => [] as Person[]
})

const { data: allRelations, status: relationsStatus } = useFetch<MatrimonialNode[]>('/api/matrimonial-nodes', {
  headers: headers as Record<string, string>,
  default: () => [] as MatrimonialNode[]
})

const isLoading = computed(() =>
  personsStatus.value === 'pending' || relationsStatus.value === 'pending'
)

// ─── Sélection des personnes ─────────────────────────────────────────────────
const isModalOpen = ref(false)
const treePersonIds = useLocalStorage<string[]>('home-tree-persons', [])

const { buildTree, getId } = useTreeBuilder()

const treePersons = computed<Person[]>(() =>
  (allPersons.value ?? []).filter(p => treePersonIds.value.includes(getId(p)))
)

function togglePerson(person: Person) {
  const id = getId(person)
  if (treePersonIds.value.includes(id)) {
    treePersonIds.value = treePersonIds.value.filter(pid => pid !== id)
  } else {
    treePersonIds.value = [...treePersonIds.value, id]
  }
}

function isSelected(person: Person) {
  return treePersonIds.value.includes(getId(person))
}

// ─── Arbre ──────────────────────────────────────────────────────────────────

const treeGroups = computed(() =>
  buildTree(treePersons.value, allRelations.value ?? [])
)
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }" title="Home">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UTooltip :shortcuts="['N']" text="Notifications">
            <UButton
              color="neutral"
              square
              variant="ghost"
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon class="size-5 shrink-0" name="i-lucide-bell" />
              </UChip>
            </UButton>
          </UTooltip>

          <UDropdownMenu :items="items">
            <UButton class="rounded-full" icon="i-lucide-plus" size="md" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-6 p-6">
        <!-- Modal de sélection des personnes -->
        <UModal v-model:open="isModalOpen" title="Sélectionner les personnes de l'arbre">
          <template #body>
            <div v-if="isLoading" class="flex items-center justify-center py-10">
              <UIcon class="size-6 text-primary animate-spin" name="i-lucide-loader-2" />
            </div>
            <div v-else-if="!allPersons?.length" class="text-center py-8 text-dimmed text-sm">
              Aucune personne créée.
              <NuxtLink class="text-primary underline underline-offset-2" to="/persons/create">
                Créer une personne
              </NuxtLink>
            </div>
            <div v-else class="flex flex-col divide-y divide-default max-h-96 overflow-y-auto">
              <button
                v-for="person in allPersons"
                :key="getId(person)"
                class="flex items-center gap-3 px-2 py-3 hover:bg-elevated transition-colors text-left w-full"
                type="button"
                @click="togglePerson(person)"
              >
                <UCheckbox :model-value="isSelected(person)" tabindex="-1" />
                <UAvatar
                  :alt="`${person.firstName} ${person.lastName}`"
                  :src="person.photo || undefined"
                  size="xs"
                />
                <span class="flex-1 min-w-0">
                  <span class="font-medium text-sm truncate block">{{ person.firstName }} {{ person.lastName }}</span>
                  <span class="text-xs text-dimmed">{{ person.birthDate ? new Date(person.birthDate).toLocaleDateString('fr-FR') : '—' }}</span>
                </span>
                <UBadge
                  v-if="isSelected(person)"
                  color="primary"
                  label="Ajouté"
                  size="xs"
                  variant="subtle"
                />
              </button>
            </div>
          </template>
          <template #footer>
            <div class="flex justify-between items-center w-full">
              <span class="text-sm text-dimmed">{{ treePersonIds.length }} personne(s) sélectionnée(s)</span>
              <UButton label="Fermer" @click="isModalOpen = false" />
            </div>
          </template>
        </UModal>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Carte arbre généalogique -->
          <div class="rounded-lg border border-default p-6 flex flex-col gap-3 sm:col-span-2">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <div class="flex items-center gap-3">
                <UIcon class="size-8 text-primary" name="i-lucide-git-fork" />
                <h3 class="text-lg font-semibold">
                  Arbre généalogique
                </h3>
                <UBadge
                  v-if="treePersons.length"
                  :label="`${treePersons.length} personne(s)`"
                  color="primary"
                  size="sm"
                  variant="subtle"
                />
              </div>
              <div class="flex gap-2">
                <UButton
                  v-if="treePersonIds.length"
                  color="error"
                  icon="i-lucide-trash-2"
                  label="Réinitialiser"
                  size="sm"
                  variant="soft"
                  @click="treePersonIds = []"
                />
                <UButton
                  icon="i-lucide-users"
                  label="Sélectionner les personnes"
                  size="sm"
                  @click="isModalOpen = true"
                />
              </div>
            </div>

            <!-- Chargement -->
            <div v-if="isLoading" class="flex items-center justify-center py-12">
              <UIcon class="size-8 text-primary animate-spin" name="i-lucide-loader-2" />
            </div>

            <!-- Arbre vide -->
            <div
              v-else-if="treePersons.length === 0"
              class="flex flex-col items-center justify-center gap-3 py-12 text-center"
            >
              <div class="p-3 rounded-full bg-primary/10">
                <UIcon class="size-8 text-primary" name="i-lucide-git-fork" />
              </div>
              <p class="text-dimmed text-sm max-w-xs">
                Cliquez sur <strong>Sélectionner les personnes</strong> pour construire votre arbre.
              </p>
            </div>

            <!-- Arbre -->
            <div v-else-if="treeGroups.length > 0" class="overflow-auto">
              <div class="flex gap-12 justify-start min-w-max p-4 pb-6">
                <TreeNode
                  v-for="group in treeGroups"
                  :key="group.key"
                  :group="group"
                />
              </div>
            </div>

            <!-- Aucun groupe trouvé -->
            <div v-else class="flex flex-col items-center gap-3 py-8 text-center">
              <UIcon class="size-6 text-dimmed" name="i-lucide-info" />
              <p class="text-sm text-dimmed">
                Aucun groupe trouvé. Vérifiez les
                <NuxtLink class="text-primary underline underline-offset-2" to="/matrimonial-nodes">
                  nœuds matrimoniaux
                </NuxtLink>.
              </p>
            </div>
          </div>

          <div class="rounded-lg border border-default p-6 flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <UIcon class="size-8 text-primary" name="i-lucide-users" />
              <h3 class="text-lg font-semibold">
                Personnes
              </h3>
            </div>
            <p class="text-dimmed text-sm">
              Gérer les individus de votre arbre généalogique.
            </p>
            <div class="flex gap-2 mt-2">
              <UButton
                label="Voir la liste"
                size="sm"
                to="/persons"
                variant="soft"
              />
              <UButton
                icon="i-lucide-plus"
                label="Ajouter"
                size="sm"
                to="/persons/create"
              />
            </div>
          </div>

          <div class="rounded-lg border border-default p-6 flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <UIcon class="size-8 text-primary" name="i-lucide-heart" />
              <h3 class="text-lg font-semibold">
                Nœuds matrimoniaux
              </h3>
            </div>
            <p class="text-dimmed text-sm">
              Gérer les relations entre les individus (mariage, PACS, union libre).
            </p>
            <div class="flex gap-2 mt-2">
              <UButton
                label="Voir la liste"
                size="sm"
                to="/matrimonial-nodes"
                variant="soft"
              />
              <UButton
                icon="i-lucide-plus"
                label="Ajouter"
                size="sm"
                to="/matrimonial-nodes/create"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
