<script lang="ts" setup>
import type {Period, Range, Stat} from '~/types'

const props = defineProps<{
  period: Period
  range: Range
}>()

function formatNumber(value: number): string {
  return value.toLocaleString('fr-FR')
}

const baseStats = [{
  title: 'Individus',
  icon: 'i-lucide-users',
  minValue: 10,
  maxValue: 50,
  minVariation: 0,
  maxVariation: 5,
  to: '/persons'
}, {
  title: 'Générations',
  icon: 'i-lucide-layers',
  minValue: 3,
  maxValue: 10,
  minVariation: 0,
  maxVariation: 1
}, {
  title: 'Documents',
  icon: 'i-lucide-file-text',
  minValue: 5,
  maxValue: 20,
  minVariation: 0,
  maxVariation: 10
}, {
  title: 'Événements',
  icon: 'i-lucide-calendar',
  minValue: 20,
  maxValue: 100,
  minVariation: 0,
  maxVariation: 15
}]

const {data: stats} = await useAsyncData<Stat[]>('stats', async () => {
  return baseStats.map((stat) => {
    const value = randomInt(stat.minValue, stat.maxValue)
    const variation = randomInt(stat.minVariation, stat.maxVariation)

    return {
      title: stat.title,
      icon: stat.icon,
      value: formatNumber(value),
      variation,
      to: stat.to
    }
  })
}, {
  watch: [() => props.period, () => props.range],
  default: () => []
})
</script>

<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="index"
      :icon="stat.icon"
      :title="stat.title"
      :to="stat.to"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
      variant="subtle"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value }}
        </span>

        <UBadge
          :color="stat.variation > 0 ? 'success' : 'error'"
          class="text-xs"
          variant="subtle"
        >
          {{ stat.variation > 0 ? '+' : '' }}{{ stat.variation }}%
        </UBadge>
      </div>
    </UPageCard>
  </UPageGrid>
</template>
