<script lang="ts" setup>
import type { HierarchyRectangularNode } from 'd3-hierarchy'
import { hierarchy, partition } from 'd3-hierarchy'
import { arc as d3Arc } from 'd3-shape'
import type { AncestorGroup } from '~/composables/useAncestorBuilder'
import type { Person } from '~/types'

const props = defineProps<{
  data: AncestorGroup
}>()

const emit = defineEmits(['select'])

const SVG_SIZE = 500
const RADIUS = 250

interface D3Node {
  person: Person
  isDummy?: boolean
  children?: D3Node[]
}

function buildD3Tree(node: AncestorGroup, depth = 0): D3Node {
  const children: D3Node[] = []

  if (node.parents && node.parents.length > 0) {
    const father = node.parents.find(p => p.person.sex === 'M')
    const mother = node.parents.find(p => p.person.sex === 'F')

    if (father) {
      children.push(buildD3Tree(father, depth + 1))
    }
    else if (depth < 4) {
      children.push({ person: { firstName: 'Inconnu', lastName: '', sex: 'M' } as Person, isDummy: true })
    }

    if (mother) {
      children.push(buildD3Tree(mother, depth + 1))
    }
    else if (depth < 4) {
      children.push({ person: { firstName: 'Inconnu', lastName: '', sex: 'F' } as Person, isDummy: true })
    }
  }

  return { person: node.person, children: children.length > 0 ? children : undefined }
}

const root = computed(() => {
  if (!props.data) return null
  const d3Data = buildD3Tree(props.data)
  const h = hierarchy<D3Node>(d3Data, n => n.children)
    .sum(n => !n.children || n.children.length === 0 ? 1 : 0)
  return partition<D3Node>().size([2 * Math.PI, RADIUS])(h)
})

const arcGenerator = d3Arc<HierarchyRectangularNode<D3Node>>()
  .startAngle(n => n.x0)
  .endAngle(n => n.x1)
  .padAngle(n => Math.min((n.x1 - n.x0) / 2, 0.005))
  .padRadius(RADIUS / 2)
  .innerRadius(n => n.y0)
  .outerRadius(n => n.y1 - 1)

function colorBySex(person: Person) {
  if (person.sex === 'M') return '#3b82f6'
  if (person.sex === 'F') return '#ec4899'
  return '#9ca3af'
}

function onSelect(person: Person, isDummy?: boolean) {
  if (isDummy) return
  emit('select', person)
}

function textTransform(node: HierarchyRectangularNode<D3Node>) {
  const angleDeg = (((node.x0 + node.x1) / 2) * 180) / Math.PI
  const midRadius = (node.y0 + node.y1) / 2
  return `rotate(${angleDeg - 90}) translate(${midRadius},0) rotate(${angleDeg < 180 ? 0 : 180})`
}
</script>

<template>
  <div class="w-full h-[500px] flex items-center justify-center relative overflow-hidden bg-white dark:bg-gray-900 rounded-lg shadow-inner">
    <svg
      v-if="root"
      :height="SVG_SIZE"
      :viewBox="`-${SVG_SIZE / 2} -${SVG_SIZE / 2} ${SVG_SIZE} ${SVG_SIZE}`"
      :width="SVG_SIZE"
      class="max-w-full max-h-full drop-shadow-lg"
    >
      <g>
        <g
          v-for="(node, i) in root.descendants()"
          :key="node.data.person._id + i"
          class="cursor-pointer group transition-all duration-300"
          @click="onSelect(node.data.person, node.data.isDummy)"
        >
          <path
            v-if="!node.data.isDummy"
            :d="arcGenerator(node)!"
            :fill="colorBySex(node.data.person)"
            class="hover:brightness-110 transition-all duration-300 stroke-white dark:stroke-gray-800"
            stroke-width="0.5"
          >
            <title>{{ node.data.person.firstName }} {{ node.data.person.lastName }}</title>
          </path>

          <!-- Etiquette sur les arcs assez larges -->
          <text
            v-if="!node.data.isDummy && node.depth > 0 && (node.x1 - node.x0) > 0.15"
            :transform="textTransform(node)"
            alignment-baseline="middle"
            class="fill-white dark:fill-gray-900 text-[9px] font-medium pointer-events-none"
            text-anchor="middle"
          >
            {{ node.data.person.firstName }} {{ node.data.person.lastName }}
          </text>

          <!-- Nom de la personne centrale -->
          <text
            v-if="node.depth === 0"
            class="fill-white dark:fill-gray-900 text-[12px] font-bold pointer-events-none"
            text-anchor="middle"
          >
            <tspan dy="-0.3em" x="0">{{ node.data.person.firstName }}</tspan>
            <tspan dy="1.2em" x="0">{{ node.data.person.lastName }}</tspan>
          </text>
        </g>
      </g>
    </svg>

    <!-- Legende -->
    <div class="absolute bottom-4 left-4 text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1.5 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-md border border-gray-200 dark:border-gray-700">
      <p class="font-medium mb-1">
        Legende
      </p>
      <div class="flex items-center gap-2">
        <div class="size-3 rounded-full bg-blue-500 shadow-sm" />
        <span>Homme</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="size-3 rounded-full bg-pink-500 shadow-sm" />
        <span>Femme</span>
      </div>
    </div>
  </div>
</template>
