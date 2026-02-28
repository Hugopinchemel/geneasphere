<script lang="ts" setup>
import type { MatrimonialNode, Person } from '~/types'

definePageMeta({ title: 'Arbre Tidy' })

const headers = useRequestHeaders(['cookie'])
const toast = useToast()

const { data: allPersons, status: personsStatus } = useFetch<Person[]>('/api/persons', {
  headers: headers as Record<string, string>,
  default: () => [] as Person[]
})

const { data: allRelations, status: relationsStatus } = useFetch<MatrimonialNode[]>('/api/matrimonial-nodes', {
  headers: headers as Record<string, string>,
  default: () => [] as MatrimonialNode[]
})

const treePersonIds = useLocalStorage<string[]>('tidy-tree-persons', [])

const treePersons = computed<Person[]>(() =>
  (allPersons.value ?? []).filter(p => treePersonIds.value.includes(getId(p)))
)

const availablePersons = computed<Person[]>(() =>
  (allPersons.value ?? []).filter(p => !treePersonIds.value.includes(getId(p)))
)

const searchQuery = ref('')
const showResults = ref(false)

const filteredPersons = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return []
  return availablePersons.value.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
  )
})

watch(searchQuery, (v) => {
  showResults.value = v.length > 0
})

function addPerson(person: Person) {
  const id = getId(person)
  if (!treePersonIds.value.includes(id)) {
    const connected = findConnectedIds([id], allRelations.value ?? [])
    treePersonIds.value = Array.from(new Set([...treePersonIds.value, ...connected]))
    toast.add({ title: `${person.firstName} ${person.lastName} et sa famille ajoutés`, color: 'success' })
  }
  searchQuery.value = ''
  showResults.value = false
}

function removePerson(id: string) {
  treePersonIds.value = treePersonIds.value.filter(pid => pid !== id)
}

function clearTree() {
  treePersonIds.value = []
  toast.add({ title: 'Arbre réinitialisé', color: 'neutral' })
}

function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR')
}

function sexIcon(sex: string) {
  if (sex === 'M') return 'i-lucide-mars'
  if (sex === 'F') return 'i-lucide-venus'
  return 'i-lucide-circle-help'
}

function sexColor(sex: string) {
  if (sex === 'M') return 'text-blue-400'
  if (sex === 'F') return 'text-pink-400'
  return 'text-dimmed'
}

const { buildTree, findConnectedIds, getId } = useTreeBuilder()

const treeGroups = computed(() =>
  buildTree(treePersons.value, allRelations.value ?? [])
)

// ─── Sunburst ───────────────────────────────────────────────────────────────
const selectedPersonForSunburst = ref<Person | null>(null)
const isSunburstModalOpen = ref(false)

function openSunburst(person: Person) {
  selectedPersonForSunburst.value = person
  isSunburstModalOpen.value = true
}

const isLoading = computed(() =>
  personsStatus.value === 'pending' || relationsStatus.value === 'pending'
)
</script>

<template>
  <UDashboardPanel id="tidy-tree">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }" title="Arbre généalogique">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            v-if="treePersons.length"
            color="error"
            icon="i-lucide-trash-2"
            label="Réinitialiser"
            size="sm"
            variant="soft"
            @click="clearTree"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
        <!-- Chargement -->
        <div v-if="isLoading" class="flex flex-col items-center gap-3 py-16">
          <UIcon class="size-8 text-primary animate-spin" name="i-lucide-loader-2" />
          <p class="text-sm text-dimmed">
            Chargement…
          </p>
        </div>

        <template v-else>
          <!-- Import -->
          <UCard variant="subtle">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon class="text-primary" name="i-lucide-user-plus" />
                <span class="font-semibold">Importer une personne</span>
              </div>
            </template>

            <div class="flex flex-col gap-2">
              <UInput
                v-model="searchQuery"
                :disabled="availablePersons.length === 0"
                icon="i-lucide-search"
                placeholder="Rechercher par prénom ou nom…"
              />

              <div
                v-if="showResults && filteredPersons.length > 0"
                class="border border-default rounded-lg overflow-hidden bg-default"
              >
                <button
                  v-for="person in filteredPersons"
                  :key="getId(person)"
                  class="flex items-center gap-3 px-4 py-2.5 hover:bg-elevated transition-colors text-left w-full border-b border-default last:border-0"
                  type="button"
                  @click="addPerson(person)"
                >
                  <UAvatar
                    :alt="`${person.firstName ?? ''} ${person.lastName ?? ''}`"
                    :src="person.photo || undefined"
                    size="xs"
                  />
                  <span class="flex flex-col min-w-0 flex-1">
                    <span class="font-medium text-sm truncate">{{ person.firstName }} {{ person.lastName }}</span>
                    <span class="text-xs text-dimmed">{{ formatDate(person.birthDate) }}</span>
                  </span>
                  <UIcon :class="sexColor(person.sex)" :name="sexIcon(person.sex)" class="shrink-0" />
                  <UIcon class="text-primary" name="i-lucide-plus" />
                </button>
              </div>

              <p v-if="showResults && filteredPersons.length === 0" class="text-sm text-dimmed text-center py-2">
                Aucun résultat pour « {{ searchQuery }} »
              </p>
              <p
                v-if="availablePersons.length === 0 && treePersons.length > 0"
                class="text-sm text-dimmed text-center py-1"
              >
                Toutes les personnes ont été ajoutées à l'arbre.
              </p>
              <p v-if="!allPersons?.length" class="text-sm text-dimmed text-center py-1">
                Aucune personne créée.
                <NuxtLink class="text-primary underline underline-offset-2" to="/persons/create">
                  Créer une personne
                </NuxtLink>
              </p>
            </div>
          </UCard>

          <!-- Membres -->
          <UCard v-if="treePersons.length > 0" variant="subtle">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon class="text-primary" name="i-lucide-users" />
                <span class="font-semibold">Membres de l'arbre</span>
                <UBadge
                  :label="`${treePersons.length}`"
                  color="primary"
                  size="sm"
                  variant="subtle"
                />
              </div>
            </template>
            <div class="flex flex-col divide-y divide-default">
              <div
                v-for="person in treePersons"
                :key="getId(person)"
                class="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <UAvatar
                  :alt="`${person.firstName ?? ''} ${person.lastName ?? ''}`"
                  :src="person.photo || undefined"
                  size="sm"
                />
                <div class="flex flex-col min-w-0 flex-1">
                  <span class="font-semibold text-sm truncate">{{ person.firstName }} {{ person.lastName }}</span>
                  <span class="text-xs text-dimmed">
                    {{ formatDate(person.birthDate) }}<template v-if="person.birthPlace"> · {{ person.birthPlace }}</template>
                  </span>
                </div>
                <UIcon :class="sexColor(person.sex)" :name="sexIcon(person.sex)" class="shrink-0" />
                <div class="flex gap-1">
                  <UButton
                    color="primary"
                    icon="i-lucide-git-fork"
                    size="xs"
                    variant="ghost"
                    @click="openSunburst(person)"
                  />
                  <UButton
                    color="neutral"
                    icon="i-lucide-x"
                    size="xs"
                    variant="ghost"
                    @click="removePerson(getId(person))"
                  />
                </div>
              </div>
            </div>
          </UCard>

          <!-- Modal Sunburst -->
          <SunburstModal
            v-model:open="isSunburstModalOpen"
            :all-persons="allPersons || []"
            :all-relations="allRelations || []"
            :person="selectedPersonForSunburst"
          />

          <!-- Arbre -->
          <UCard v-if="treePersons.length > 0" variant="subtle">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon class="text-primary" name="i-lucide-git-fork" />
                <span class="font-semibold">Arbre</span>
                <UBadge
                  v-if="treeGroups.length"
                  :label="`${treeGroups.length} groupe(s)`"
                  color="neutral"
                  size="sm"
                  variant="outline"
                />
              </div>
            </template>

            <div v-if="treeGroups.length > 0" class="overflow-auto p-6">
              <div class="flex gap-12 justify-start min-w-max pb-4">
                <TreeNode
                  v-for="group in treeGroups"
                  :key="group.key"
                  :group="group"
                  @click-person="openSunburst"
                />
              </div>
            </div>

            <div v-else class="flex flex-col items-center gap-3 py-10 text-center">
              <UIcon class="size-8 text-dimmed" name="i-lucide-info" />
              <p class="text-sm text-dimmed">
                Aucun groupe trouvé. Vérifiez les
                <NuxtLink class="text-primary underline underline-offset-2" to="/matrimonial-nodes">
                  nœuds matrimoniaux
                </NuxtLink>
                .
              </p>
            </div>
          </UCard>

          <!-- État vide -->
          <div v-if="treePersons.length === 0" class="flex flex-col items-center justify-center gap-4 py-20">
            <div class="p-4 rounded-full bg-primary/10">
              <UIcon class="size-10 text-primary" name="i-lucide-git-fork" />
            </div>
            <p class="font-semibold text-lg">
              L'arbre est vide
            </p>
            <p class="text-dimmed text-sm text-center max-w-xs">
              Recherchez une personne ci-dessus pour commencer à construire votre arbre généalogique.
            </p>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>

