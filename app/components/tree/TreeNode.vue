<script lang="ts" setup>
import type {Person, TreeGroup} from '~/types'

const props = defineProps<{
  group: TreeGroup
}>()

const emit = defineEmits(['click-person'])

function formatDate(date?: string | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString('fr-FR', {year: 'numeric'})
}

function sexCardClass(person: Person) {
  if (person.sex === 'M') return 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
  if (person.sex === 'F') return 'ring-2 ring-pink-500 bg-pink-50/50 dark:bg-pink-900/20'
  return 'ring-1 ring-gray-300 dark:ring-gray-700 bg-default'
}

function sexBadgeColor(person: Person): 'info' | 'error' | 'neutral' {
  if (person.sex === 'M') return 'info'
  if (person.sex === 'F') return 'error'
  return 'neutral'
}

function sexLabel(person: Person) {
  if (person.sex === 'M') return 'H'
  if (person.sex === 'F') return 'F'
  return '?'
}

const statusIcon: Record<string, string> = {
  marié: 'i-lucide-rings-wedding',
  divorcé: 'i-lucide-heart-crack',
  pacsé: 'i-lucide-handshake',
  union: 'i-lucide-heart',
  union_libre: 'i-lucide-heart',
  inconnu: 'i-lucide-circle-help'
}

const statusColor: Record<string, string> = {
  marié: 'text-primary',
  divorcé: 'text-red-500',
  pacsé: 'text-blue-500',
  union: 'text-pink-500',
  union_libre: 'text-pink-500',
  inconnu: 'text-gray-400'
}

const coupleIcon = computed(() =>
  props.group.coupleStatus ? (statusIcon[props.group.coupleStatus] ?? 'i-lucide-heart') : 'i-lucide-heart'
)

const coupleIconColor = computed(() =>
  props.group.coupleStatus ? (statusColor[props.group.coupleStatus] ?? 'text-primary') : 'text-primary'
)

const isCouple = computed(() => props.group.persons.length >= 2)
const isDivorced = computed(() => props.group.coupleStatus === 'divorcé')

function childLinkClass(linkType: string) {
  const base = isDivorced.value ? 'border-dashed border-red-500' : ''
  if (linkType === 'adoption') {
    return `${base} border-l-4 border-black dark:border-white`
  }
  if (linkType === 'gpa') {
    return `${base} border-l-4 border-blue-600`
  }
  if (linkType === 'biologique') {
    return `${base} border-l-2 border-green-500`
  }
  return `${base} w-1 bg-gray-400 dark:bg-gray-500`
}
</script>

<template>
  <div class="flex flex-col items-center select-none">
    <!-- ── Groupe (couple ou solo) ── -->
    <div class="flex items-center">
      <!-- Cas parents vides (Point 2) -->
      <template v-if="group.persons.length === 0">
        <div
          class="flex flex-col items-center p-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
        >
          <UTooltip :text="group.coupleStatus || 'Union sans parents connus'">
            <UIcon
              :class="coupleIconColor"
              :name="coupleIcon"
              class="size-8"
            />
          </UTooltip>
        </div>
      </template>

      <!-- Première personne (ou seule) -->
      <div
        v-if="group.persons[0]"
        :class="sexCardClass(group.persons[0]!)"
        class="rounded-xl shadow-sm w-32 flex flex-col items-center gap-2 p-3 cursor-pointer transition-all hover:shadow-md hover:scale-105"
        @click="emit('click-person', group.persons[0]!)"
      >
        <UAvatar
          :alt="`${group.persons[0]!.firstName} ${group.persons[0]!.lastName}`"
          :src="group.persons[0]!.photo || undefined"
          size="lg"
        />
        <div class="text-center leading-tight w-full">
          <p class="font-semibold text-sm truncate text-highlighted">
            {{ group.persons[0]!.firstName }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wide truncate">
            {{ group.persons[0]!.lastName }}
          </p>
        </div>
        <div class="flex items-center justify-between w-full gap-1">
          <span
            v-if="group.persons[0]!.birthDate || group.persons[0]!.deathDate"
            class="text-xs text-gray-500 dark:text-gray-400 leading-none"
          >
            <template v-if="group.persons[0]!.birthDate">{{ formatDate(group.persons[0]!.birthDate) }}</template>
            <template v-if="group.persons[0]!.deathDate"> – {{ formatDate(group.persons[0]!.deathDate) }}</template>
          </span>
          <UBadge
            :color="sexBadgeColor(group.persons[0]!)"
            :label="sexLabel(group.persons[0]!)"
            class="ml-auto shrink-0"
            size="xs"
            variant="subtle"
          />
        </div>
      </div>

      <!-- Connecteur couple -->
      <template v-if="isCouple">
        <div class="flex flex-col items-center px-2 gap-1">
          <div
            :class="[isDivorced ? 'border-t-2 border-dashed border-red-500' : 'h-1 bg-gray-400 dark:bg-gray-500', 'w-6']"
          />
          <UTooltip :text="group.coupleStatus ?? 'union'">
            <UIcon
              :class="coupleIconColor"
              :name="coupleIcon"
              class="size-5 shrink-0"
            />
          </UTooltip>
          <div
            :class="[isDivorced ? 'border-t-2 border-dashed border-red-500' : 'h-1 bg-gray-400 dark:bg-gray-500', 'w-6']"
          />
        </div>

        <!-- Deuxième personne -->
        <div
          :class="sexCardClass(group.persons[1]!)"
          class="rounded-xl shadow-sm w-32 flex flex-col items-center gap-2 p-3 cursor-pointer transition-all hover:shadow-md hover:scale-105"
          @click="emit('click-person', group.persons[1]!)"
        >
          <UAvatar
            :alt="`${group.persons[1]!.firstName} ${group.persons[1]!.lastName}`"
            :src="group.persons[1]!.photo || undefined"
            size="lg"
          />
          <div class="text-center leading-tight w-full">
            <p class="font-semibold text-sm truncate text-highlighted">
              {{ group.persons[1]!.firstName }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wide truncate">
              {{ group.persons[1]!.lastName }}
            </p>
          </div>
          <div class="flex items-center justify-between w-full gap-1">
            <span
              v-if="group.persons[1]!.birthDate || group.persons[1]!.deathDate"
              class="text-xs text-gray-500 dark:text-gray-400 leading-none"
            >
              <template v-if="group.persons[1]!.birthDate">{{ formatDate(group.persons[1]!.birthDate) }}</template>
              <template v-if="group.persons[1]!.deathDate"> – {{ formatDate(group.persons[1]!.deathDate) }}</template>
            </span>
            <UBadge
              :color="sexBadgeColor(group.persons[1]!)"
              :label="sexLabel(group.persons[1]!)"
              class="ml-auto shrink-0"
              size="xs"
              variant="subtle"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- ── Enfants ── -->
    <template v-if="group.children.length">
      <div
        :class="[isDivorced ? 'border-l-2 border-dashed border-red-500' : 'w-1 bg-gray-400 dark:bg-gray-500', 'h-8']"
      />
      <div class="flex gap-12">
        <div
          v-for="child in group.children"
          :key="child.node.key"
          class="flex flex-col items-center"
        >
          <div :class="[childLinkClass(child.linkType), 'h-8']"/>
          <TreeNode
            :group="child.node"
            @click-person="emit('click-person', $event)"
          />
        </div>
      </div>
    </template>
  </div>
</template>
