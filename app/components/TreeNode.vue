<script lang="ts" setup>
import type { Person, TreeGroup } from '~/types'

const props = defineProps<{
  group: TreeGroup
}>()

function formatDate(date?: string | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric' })
}

function sexBorderClass(person: Person) {
  if (person.sex === 'M') return 'ring-2 ring-blue-400 dark:ring-blue-500'
  if (person.sex === 'F') return 'ring-2 ring-pink-400 dark:ring-pink-500'
  return 'ring-1 ring-default'
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
  'marié': 'i-lucide-rings-wedding',
  'divorcé': 'i-lucide-heart-crack',
  'pacsé': 'i-lucide-handshake',
  'union_libre': 'i-lucide-heart',
  'inconnu': 'i-lucide-circle-help',
}

const statusColor: Record<string, string> = {
  'marié': 'text-primary',
  'divorcé': 'text-error',
  'pacsé': 'text-info',
  'union_libre': 'text-pink-400',
  'inconnu': 'text-dimmed',
}

const coupleIcon = computed(() =>
  props.group.coupleStatus ? (statusIcon[props.group.coupleStatus] ?? 'i-lucide-heart') : 'i-lucide-heart'
)

const coupleIconColor = computed(() =>
  props.group.coupleStatus ? (statusColor[props.group.coupleStatus] ?? 'text-primary') : 'text-primary'
)

const isCouple = computed(() => props.group.persons.length >= 2)
</script>

<template>
  <div class="flex flex-col items-center select-none">
    <!-- ── Groupe (couple ou solo) ── -->
    <div class="flex items-center">
      <!-- Première personne (ou seule) -->
      <div
        :class="sexBorderClass(group.persons[0]!)"
        class="bg-default rounded-xl shadow-sm w-32 flex flex-col items-center gap-2 p-3 cursor-default transition-shadow hover:shadow-md"
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
          <p class="text-xs text-dimmed uppercase tracking-wide truncate">
            {{ group.persons[0]!.lastName }}
          </p>
        </div>
        <div class="flex items-center justify-between w-full gap-1">
          <span
            v-if="group.persons[0]!.birthDate || group.persons[0]!.deathDate"
            class="text-xs text-dimmed leading-none"
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
          <div class="h-px w-6 bg-muted" />
          <UTooltip :text="group.coupleStatus ?? 'union'">
            <UIcon
              :class="coupleIconColor"
              :name="coupleIcon"
              class="size-5 shrink-0"
            />
          </UTooltip>
          <div class="h-px w-6 bg-muted" />
        </div>

        <!-- Deuxième personne -->
        <div
          :class="sexBorderClass(group.persons[1]!)"
          class="bg-default rounded-xl shadow-sm w-32 flex flex-col items-center gap-2 p-3 cursor-default transition-shadow hover:shadow-md"
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
            <p class="text-xs text-dimmed uppercase tracking-wide truncate">
              {{ group.persons[1]!.lastName }}
            </p>
          </div>
          <div class="flex items-center justify-between w-full gap-1">
            <span
              v-if="group.persons[1]!.birthDate || group.persons[1]!.deathDate"
              class="text-xs text-dimmed leading-none"
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
      <div class="w-px h-8 bg-muted" />
      <div class="flex gap-8">
        <div
          v-for="child in group.children"
          :key="child.key"
          class="flex flex-col items-center"
        >
          <div class="w-px h-8 bg-muted" />
          <TreeNode :group="child" />
        </div>
      </div>
    </template>
  </div>
</template>
