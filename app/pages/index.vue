<script lang="ts" setup>
import type {DropdownMenuItem} from '@nuxt/ui'

const {isNotificationsSlideoverOpen} = useDashboard()

const items = [[{
  label: 'Ajouter une personne',
  icon: 'i-lucide-user-plus',
  to: '/persons/create'
}, {
  label: 'Ajouter un nœud matrimonial',
  icon: 'i-lucide-heart',
  to: '/matrimonial-nodes/create'
}]] satisfies DropdownMenuItem[][]
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }" title="Home">
        <template #leading>
          <UDashboardSidebarCollapse/>
        </template>
        <template #right>
          <UTooltip :shortcuts="['N']" text="Notifications">
            <UButton
              color="neutral"
              square
              variant="ghost"
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon class="size-5 shrink-0" name="i-lucide-bell"/>
              </UChip>
            </UButton>
          </UTooltip>

          <UDropdownMenu :items="items">
            <UButton class="rounded-full" icon="i-lucide-plus" size="md"/>
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-6 p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="rounded-lg border border-default p-6 flex flex-col gap-3">
            <div class="flex items-center gap-3">
              saucisse
            </div>
          </div>

          <div class="rounded-lg border border-default p-6 flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <UIcon class="size-8 text-primary" name="i-lucide-users"/>
              <h3 class="text-lg font-semibold">
                Personnes
              </h3>
            </div>
            <p class="text-dimmed text-sm">
              Gérer les individus de votre arbre généalogique.
            </p>
            <div class="flex gap-2 mt-2">
              <UButton
                label="Voir la liste"
                size="sm"
                to="/persons"
                variant="soft"
              />
              <UButton
                icon="i-lucide-plus"
                label="Ajouter"
                size="sm"
                to="/persons/create"
              />
            </div>
          </div>

          <div class="rounded-lg border border-default p-6 flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <UIcon class="size-8 text-primary" name="i-lucide-heart"/>
              <h3 class="text-lg font-semibold">
                Nœuds matrimoniaux
              </h3>
            </div>
            <p class="text-dimmed text-sm">
              Gérer les relations entre les individus (mariage, PACS, union libre).
            </p>
            <div class="flex gap-2 mt-2">
              <UButton
                label="Voir la liste"
                size="sm"
                to="/matrimonial-nodes"
                variant="soft"
              />
              <UButton
                icon="i-lucide-plus"
                label="Ajouter"
                size="sm"
                to="/matrimonial-nodes/create"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
