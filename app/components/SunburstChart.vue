<script lang="ts" setup>
import { hierarchy, partition } from 'd3-hierarchy'
import type { HierarchyRectangularNode } from 'd3-hierarchy'
import { arc as d3Arc } from 'd3-shape'
import type { AncestorGroup } from '~/composables/useAncestorBuilder'
import type { Person } from '~/types'

const props = defineProps<{
  data: AncestorGroup
}>()

const emit = defineEmits(['select'])

const width = 500
const radius = 250

interface D3Node {
  person: Person
  isDummy?: boolean
  children?: D3Node[]
}

// Transformer la structure récursive en format attendu par d3.hierarchy
function transformData(node: AncestorGroup, depth = 0): D3Node {
  const children: D3Node[] = []

  if (node.parents && node.parents.length > 0) {
    // On essaie de placer Père à gauche (0) et Mère à droite (1)
    const father = node.parents.find(p => p.person.sex === 'M')
    const mother = node.parents.find(p => p.person.sex === 'F')

    if (father) {
      children.push(transformData(father, depth + 1))
    } else if (depth < 4) {
      // Parent inconnu (Père)
      children.push({ person: { firstName: 'Inconnu', lastName: '', sex: 'M' } as Person, isDummy: true })
    }

    if (mother) {
      children.push(transformData(mother, depth + 1))
    } else if (depth < 4) {
      // Parent inconnu (Mère)
      children.push({ person: { firstName: 'Inconnu', lastName: '', sex: 'F' } as Person, isDummy: true })
    }
  }

  return {
    person: node.person,
    children: children.length > 0 ? children : undefined
  }
}

const root = computed(() => {
  if (!props.data) return null
  const d3Data = transformData(props.data)
  const h = hierarchy<D3Node>(d3Data)
    .sum(d => !d.children || d.children.length === 0 ? 1 : 0) // Donner du poids aux feuilles uniquement

  return partition<D3Node>()
    .size([2 * Math.PI, radius])(h)
})

const arcGenerator = d3Arc<HierarchyRectangularNode<D3Node>>()
  .startAngle(d => d.x0)
  .endAngle(d => d.x1)
  .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
  .padRadius(radius / 2)
  .innerRadius(d => d.y0)
  .outerRadius(d => d.y1 - 1)

const color = (person: Person) => {
  if (person.sex === 'M') return '#3b82f6' // Blue-500
  if (person.sex === 'F') return '#ec4899' // Pink-500
  return '#9ca3af' // Gray-400
}

function handleSelect(person: Person, isDummy?: boolean) {
  if (isDummy) return
  emit('select', person)
}

function getTextTransform(node: HierarchyRectangularNode<D3Node>) {
  const x = (((node.x0 + node.x1) / 2) * 180) / Math.PI
  const y = (node.y0 + node.y1) / 2
  return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`
}
</script>

<template>
  <div class="w-full h-[500px] flex items-center justify-center relative overflow-hidden bg-white dark:bg-gray-900 rounded-lg shadow-inner">
    <svg
      v-if="root"
      :width="width"
      :height="width"
      :viewBox="`-${width / 2} -${width / 2} ${width} ${width}`"
      class="max-w-full max-h-full drop-shadow-lg"
    >
      <g>
        <g
          v-for="(node, i) in root.descendants()"
          :key="node.data.person._id + i"
          class="cursor-pointer group transition-all duration-300"
          @click="handleSelect(node.data.person, node.data.isDummy)"
        >
          <path
            v-if="!node.data.isDummy"
            :d="arcGenerator(node)!"
            :fill="color(node.data.person)"
            class="hover:brightness-110 transition-all duration-300 stroke-white dark:stroke-gray-800"
            stroke-width="0.5"
          >
            <title>{{ node.data.person.firstName }} {{ node.data.person.lastName }}</title>
          </path>
          <text
            v-if="!node.data.isDummy && node.depth > 0 && (node.x1 - node.x0) > 0.15"
            :transform="getTextTransform(node)"
            text-anchor="middle"
            alignment-baseline="middle"
            class="fill-white dark:fill-gray-900 text-[9px] font-medium pointer-events-none"
          >
            {{ node.data.person.firstName }} {{ node.data.person.lastName }}
          </text>

          <!-- Nom au centre -->
          <text
            v-if="node.depth === 0"
            text-anchor="middle"
            class="fill-white dark:fill-gray-900 text-[12px] font-bold pointer-events-none"
          >
            <tspan x="0" dy="-0.3em">{{ node.data.person.firstName }}</tspan>
            <tspan x="0" dy="1.2em">{{ node.data.person.lastName }}</tspan>
          </text>
        </g>
      </g>
    </svg>

    <div class="absolute bottom-4 left-4 text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1.5 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-md border border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2 font-medium mb-1">
        Légende
      </div>
      <div class="flex items-center gap-2">
        <div class="size-3 rounded-full bg-blue-500 shadow-sm" /> <span>Homme</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="size-3 rounded-full bg-pink-500 shadow-sm" /> <span>Femme</span>
      </div>
    </div>
  </div>
</template>
