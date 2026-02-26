<script lang="ts" setup>
import type { Person } from '~/types'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'

const toast = useToast()
const headers = useRequestHeaders(['cookie'])

const { data: persons, status, refresh } = useFetch<Person[]>('/api/persons', {
  headers: headers as Record<string, string>,
  default: () => [] as Person[]
})

const columns: TableColumn<Person>[] = [
  { accessorKey: 'firstName', header: 'Prénom' },
  { accessorKey: 'lastName', header: 'Nom' },
  { accessorKey: 'sex', header: 'Sexe' },
  { accessorKey: 'birthDate', header: 'Date de naissance' },
  { accessorKey: 'birthPlace', header: 'Lieu de naissance' },
  { accessorKey: '_id', header: 'Actions' }
]

function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR')
}

function sexLabel(sex: string) {
  switch (sex) {
    case 'M':
      return 'Homme'
    case 'F':
      return 'Femme'
    default:
      return 'Autre'
  }
}

async function deletePerson(id: string) {
  try {
    await $fetch(`/api/persons/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Personne supprimée', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  }
}

function getActions(person: Person): DropdownMenuItem[][] {
  return [[
    {
      label: 'Modifier',
      icon: 'i-lucide-pencil',
      to: `/persons/${person._id}`
    }
  ], [
    {
      label: 'Supprimer',
      icon: 'i-lucide-trash',
      color: 'error' as const,
      onSelect: () => deletePerson(person._id)
    }
  ]]
}
</script>

<template>
  <UDashboardPanel id="persons">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }" title="Personnes">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="Nouvelle personne"
            to="/persons/create"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="status === 'pending'" class="flex justify-center py-16">
        <UIcon class="size-8 text-primary animate-spin" name="i-lucide-loader-2" />
      </div>
      <div v-else-if="persons?.length" class="flex flex-col gap-4 p-4">
        <UTable :columns="columns" :data="persons">
          <template #sex-cell="{ row }">
            {{ sexLabel(row.original.sex) }}
          </template>
          <template #birthDate-cell="{ row }">
            {{ formatDate(row.original.birthDate) }}
          </template>
          <template #_id-cell="{ row }">
            <UDropdownMenu :items="getActions(row.original)">
              <UButton
                color="neutral"
                icon="i-lucide-ellipsis-vertical"
                size="sm"
                variant="ghost"
              />
            </UDropdownMenu>
          </template>
        </UTable>
      </div>
      <div v-else class="flex flex-col items-center justify-center gap-4 p-12">
        <UIcon class="size-12 text-dimmed" name="i-lucide-users" />
        <p class="text-muted text-lg">
          Aucune personne enregistrée
        </p>
        <UButton
          icon="i-lucide-plus"
          label="Ajouter une personne"
          to="/persons/create"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
