<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'
import type { Mail, Notification } from '~/types'

const toast = useToast()
const { isNotificationsSlideoverOpen } = useDashboard()

const open = ref(false)

const { data: mails } = useFetch<Mail[]>('/api/mails', { default: () => [] })
const { data: notifications } = useFetch<Notification[]>('/api/notifications', { default: () => [] })

const unreadMailsCount = computed(() => mails.value.filter(m => m.unread).length)
const unreadNotificationsCount = computed(() => notifications.value.filter(n => n.unread).length)

const links = computed(() => [[{
  label: 'Accueil',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Personnes',
  icon: 'i-lucide-users',
  to: '/persons',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Nœuds matrimoniaux',
  icon: 'i-lucide-heart',
  to: '/matrimonial-nodes',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Liens',
  icon: 'i-lucide-inbox',
  to: '/inbox',
  badge: unreadMailsCount.value > 0 ? String(unreadMailsCount.value) : undefined,
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Paramètres',
  to: '/settings',
  icon: 'i-lucide-settings',
  defaultOpen: true,
  type: 'trigger',
  children: [{
    label: 'Général',
    to: '/settings',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Notifications',
    to: '/settings/notifications',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Sécurité',
    to: '/settings/security',
    onSelect: () => {
      open.value = false
    }
  }]
}]] satisfies NavigationMenuItem[][])

const groups = computed(() => [{
  id: 'navigation',
  label: 'Navigation',
  items: [{
    label: 'Home',
    icon: 'i-lucide-house',
    to: '/'
  }, {
    label: 'Personnes',
    icon: 'i-lucide-users',
    to: '/persons'
  }, {
    label: 'Nœuds matrimoniaux',
    icon: 'i-lucide-heart',
    to: '/matrimonial-nodes'
  }, {
    label: 'Inbox',
    icon: 'i-lucide-inbox',
    to: '/inbox'
  }, {
    label: 'Paramètres',
    icon: 'i-lucide-settings',
    to: '/settings'
  }]
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
      class="bg-elevated/25"
      collapsible
      data-sidebar-root
      resizable
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          popover
          tooltip
        />
      </template>

      <template #footer="{ collapsed }">
        <div :class="collapsed ? 'flex-col gap-1' : 'gap-1'" class="flex items-center">
          <UTooltip :shortcuts="['N']" text="Notifications">
            <UChip
              :show="unreadNotificationsCount > 0"
              :text="unreadNotificationsCount > 0 ? String(unreadNotificationsCount) : undefined"
              color="error"
              inset
              size="sm"
            >
              <UButton
                :square="true"
                color="neutral"
                icon="i-lucide-bell"
                variant="ghost"
                @click="isNotificationsSlideoverOpen = true"
              />
            </UChip>
          </UTooltip>
        </div>

        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
