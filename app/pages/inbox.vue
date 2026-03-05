<script lang="ts" setup>
import { breakpointsTailwind } from '@vueuse/core'
import type { Mail } from '~/types'

const tabItems = [
  { label: 'Tous', value: 'all' },
  { label: 'Non lus', value: 'unread' }
]
const selectedTab = ref('all')

const { user } = useUserSession()

const { data: mails, status, error, refresh } = useFetch<Mail[]>('/api/mails', {
  default: () => [] as Mail[]
})

const filteredMails = computed(() => {
  if (selectedTab.value === 'unread') return mails.value.filter(m => !!m.unread)
  return mails.value
})

const selectedMail = ref<Mail | null>(null)

const isMailPanelOpen = computed({
  get: () => !!selectedMail.value,
  set: (v: boolean) => { if (!v) selectedMail.value = null }
})

watch(filteredMails, () => {
  if (!filteredMails.value.find(m => m.uid === selectedMail.value?.uid)) {
    selectedMail.value = null
  }
})

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('lg')
</script>

<template>
  <UDashboardPanel
    id="inbox-1"
    :default-size="25"
    :max-size="30"
    :min-size="20"
    resizable
  >
    <UDashboardNavbar title="Boîte de réception">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
      <template #trailing>
        <UBadge :label="filteredMails.length" variant="subtle" />
      </template>
      <template #right>
        <UButton
          :loading="status === 'pending'"
          color="neutral"
          icon="i-lucide-refresh-cw"
          size="xs"
          variant="ghost"
          @click="() => refresh()"
        />
        <UTabs
          v-model="selectedTab"
          :content="false"
          :items="tabItems"
          size="xs"
        />
      </template>
    </UDashboardNavbar>

    <!-- Inbox désactivée -->
    <div v-if="!user?.inboxEnabled" class="flex flex-col items-center justify-center gap-3 p-8 text-center h-full">
      <UIcon class="size-10 text-dimmed" name="i-lucide-mail-off" />
      <p class="font-medium text-sm">
        Boîte de réception désactivée
      </p>
      <p class="text-xs text-dimmed max-w-56">
        Activez la dans vos
        <NuxtLink class="text-primary underline underline-offset-2" to="/settings">
          paramètres de profil
        </NuxtLink>
        pour voir vos emails.
      </p>
    </div>

    <!-- Erreur IMAP -->
    <div v-else-if="error" class="flex flex-col items-center justify-center gap-3 p-8 text-center h-full">
      <UIcon class="size-10 text-error" name="i-lucide-alert-triangle" />
      <p class="font-medium text-sm">
        Impossible de charger les emails
      </p>
      <p class="text-xs text-dimmed">
        {{ (error as { statusMessage?: string }).statusMessage || 'Erreur de connexion IMAP' }}
      </p>
      <UButton
        color="neutral"
        icon="i-lucide-refresh-cw"
        label="Réessayer"
        size="xs"
        variant="soft"
        @click="() => refresh()"
      />
    </div>

    <InboxList
      v-else
      v-model="selectedMail"
      :mails="filteredMails"
    />
  </UDashboardPanel>

  <InboxMail
    v-if="selectedMail"
    :mail="selectedMail"
    @close="selectedMail = null"
  />
  <div v-else class="hidden lg:flex flex-1 items-center justify-center">
    <UIcon class="size-32 text-dimmed" name="i-lucide-inbox" />
  </div>

  <ClientOnly>
    <USlideover v-if="isMobile" v-model:open="isMailPanelOpen">
      <template #content>
        <InboxMail
          v-if="selectedMail"
          :mail="selectedMail"
          @close="selectedMail = null"
        />
      </template>
    </USlideover>
  </ClientOnly>
</template>
