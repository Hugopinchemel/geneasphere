<script lang="ts" setup>
import type { MatrimonialNode, Person } from '~/types'
import type { TableColumn } from '@nuxt/ui'

const toast = useToast()
const headers = useRequestHeaders(['cookie'])

const { data: nodes, status, refresh } = useFetch<MatrimonialNode[]>('/api/matrimonial-nodes', {
  headers: headers as Record<string, string>,
  default: () => [] as MatrimonialNode[]
})

const statusLabels: Record<string, string> = {
  married: 'Marié(e)',
  divorced: 'Divorcé(e)',
  pacsed: 'Pacsé(e)',
  union_libre: 'Union libre',
  inconnu: 'Inconnu'
}

const statusColors: Record<string, string> = {
  married: 'success',
  divorced: 'error',
  pacsed: 'info',
  union_libre: 'warning',
  inconnu: 'neutral'
}

function personName(p: string | Person) {
  if (typeof p === 'string') return p
  return `${p.firstName} ${p.lastName || ''}`.trim()
}

function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR')
}

const columns: TableColumn<MatrimonialNode>[] = [
  { accessorKey: 'status', header: 'Statut' },
  { accessorKey: 'parents', header: 'Parents' },
  { accessorKey: 'children', header: 'Enfants' },
  { accessorKey: 'startDate', header: 'Début' },
  { accessorKey: 'endDate', header: 'Fin' },
  { accessorKey: '_id', header: 'Actions' }
]

async function deleteNode(id: string) {
  try {
    await $fetch(`/api/matrimonial-nodes/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Nœud supprimé', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  }
}
</script>

<template>
  <UDashboardPanel id="matrimonial-nodes">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }" title="Nœuds matrimoniaux">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="Nouveau nœud"
            to="/matrimonial-nodes/create"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UDashboardToolbar>
        <template #left>
          <div class="flex items-center gap-1.5">
            <UBadge :label="nodes?.length" color="neutral" variant="subtle" />
          </div>
        </template>
      </UDashboardToolbar>

      <div v-if="status === 'pending'" class="flex justify-center py-16">
        <UIcon class="size-8 text-primary animate-spin" name="i-lucide-loader-2" />
      </div>
      <div v-else-if="nodes?.length" class="flex flex-col gap-4 p-4">
        <UTable :columns="columns" :data="nodes">
          <template #status-cell="{ row }">
            <UBadge :color="(statusColors[row.original.status] as any) || 'neutral'" variant="subtle">
              {{ statusLabels[row.original.status] || row.original.status }}
            </UBadge>
          </template>
          <template #parents-cell="{ row }">
            <div class="flex flex-col gap-0.5">
              <span v-if="!row.original.parents.length" class="text-dimmed">Aucun parent</span>
              <span v-for="(parent, i) in row.original.parents" :key="i">
                {{ personName(parent) }}
              </span>
            </div>
          </template>
          <template #children-cell="{ row }">
            <div class="flex flex-col gap-0.5">
              <span v-if="!row.original.children.length" class="text-dimmed">Aucun enfant</span>
              <span v-for="(child, i) in row.original.children" :key="i">
                {{ personName(child.person) }}
                <UBadge
                  v-if="child.linkType !== 'biologique'"
                  color="warning"
                  size="xs"
                  variant="subtle"
                >
                  {{ child.linkType }}
                </UBadge>
              </span>
            </div>
          </template>
          <template #startDate-cell="{ row }">
            {{ formatDate(row.original.startDate) }}
          </template>
          <template #endDate-cell="{ row }">
            {{ formatDate(row.original.endDate) }}
          </template>
          <template #_id-cell="{ row }">
            <div class="flex gap-2">
              <UButton
                icon="i-lucide-pencil"
                color="primary"
                label="Modifier"
                :to="`/matrimonial-nodes/${row.original._id}`"
              />
              <UButton
                color="error"
                icon="i-lucide-trash"
                label="Supprimer"
                @click="deleteNode(row.original._id)"
              />
            </div>
          </template>
        </UTable>
      </div>
      <div v-else class="flex flex-col items-center justify-center gap-4 p-12">
        <UIcon class="size-12 text-dimmed" name="i-lucide-heart" />
        <p class="text-muted text-lg">
          Aucun nœud matrimonial
        </p>
        <UButton
          icon="i-lucide-plus"
          label="Créer un nœud matrimonial"
          to="/matrimonial-nodes/create"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
