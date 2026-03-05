<script lang="ts" setup>
import type { MatrimonialNode, Person } from '~/types'

const props = defineProps<{
  person: Person | null
  allPersons: Person[]
  allRelations: MatrimonialNode[]
}>()

const open = defineModel<boolean>('open', { default: false })

const { buildAncestors } = useAncestorBuilder()

const selectedPerson = ref<Person | null>(null)
const navHistory = ref<Person[]>([])

watch(() => props.person, (newPerson) => {
  if (newPerson) {
    selectedPerson.value = newPerson
    navHistory.value = [newPerson]
  }
}, { immediate: true })

const ancestorData = computed(() => {
  if (!selectedPerson.value || !props.allPersons) return null
  return buildAncestors(selectedPerson.value, props.allPersons, props.allRelations)
})

function navigateTo(person: Person) {
  selectedPerson.value = person
  if (navHistory.value[navHistory.value.length - 1]?._id !== person._id) {
    navHistory.value.push(person)
  }
}

function goBack() {
  if (navHistory.value.length > 1) {
    navHistory.value.pop()
    selectedPerson.value = navHistory.value[navHistory.value.length - 1]!
  }
}
</script>

<template>
  <UModal v-model:open="open" fullscreen title="Diagramme ancestral (Sunburst)">
    <template #body>
      <div v-if="ancestorData" class="flex flex-col items-center">
        <div class="mb-6 text-center relative w-full flex flex-col items-center max-w-2xl">
          <div class="absolute left-0 top-1/2 -translate-y-1/2">
            <UButton
              v-if="navHistory.length > 1"
              color="neutral"
              icon="i-lucide-arrow-left"
              label="Retour"
              size="sm"
              variant="ghost"
              @click="goBack"
            />
          </div>
          <h3 class="text-xl font-bold">
            Genealogie de {{ selectedPerson?.firstName }} {{ selectedPerson?.lastName }}
          </h3>
          <p class="text-sm text-dimmed mt-1">
            Cliquez sur un segment pour explorer cette branche
          </p>
        </div>
        <SunburstChart :data="ancestorData" @select="navigateTo" />
      </div>
    </template>
  </UModal>
</template>
