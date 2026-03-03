<script lang="ts" setup>
import type {MatrimonialNode, Person} from '~/types'

const props = defineProps<{
  person: Person | null
  allPersons: Person[]
  allRelations: MatrimonialNode[]
}>()

const open = defineModel<boolean>('open', {default: false})

const {buildAncestors} = useAncestorBuilder()

const selectedPerson = ref<Person | null>(null)
const history = ref<Person[]>([])

watch(() => props.person, (newPerson) => {
  if (newPerson) {
    selectedPerson.value = newPerson
    history.value = [newPerson]
  }
}, {immediate: true})

const ancestorData = computed(() => {
  if (!selectedPerson.value || !props.allPersons) return null
  return buildAncestors(selectedPerson.value, props.allPersons, props.allRelations)
})

function handleSelect(person: Person) {
  selectedPerson.value = person
  if (history.value[history.value.length - 1]?._id !== person._id) {
    history.value.push(person)
  }
}

function goBack() {
  if (history.value.length > 1) {
    history.value.pop()
    selectedPerson.value = history.value[history.value.length - 1]!
  }
}
</script>

<template>
  <UModal v-model:open="open" fullscreen title="Diagramme Sunburst (Ancêtres)">
    <template #body>
      <div v-if="ancestorData" class="flex flex-col items-center">
        <div class="mb-6 text-center relative w-full flex flex-col items-center max-w-2xl">
          <div class="absolute left-0 top-1/2 -translate-y-1/2">
            <UButton
              v-if="history.length > 1"
              color="neutral"
              icon="i-lucide-arrow-left"
              label="Retour"
              size="sm"
              variant="ghost"
              @click="goBack"
            />
          </div>
          <h3 class="text-xl font-bold">
            Généalogie de {{ selectedPerson?.firstName }} {{ selectedPerson?.lastName }}
          </h3>
          <p class="text-sm text-dimmed mt-1">
            Cliquez sur un segment pour explorer cette branche
          </p>
        </div>

        <SunburstChart :data="ancestorData" @select="handleSelect"/>
      </div>
    </template>
  </UModal>
</template>
