<script lang="ts" setup>
import { format } from 'date-fns'
import type { Mail } from '~/types'

defineProps<{
  mail: Mail
}>()

const emits = defineEmits(['close'])

const dropdownItems = [[{
  label: 'Mark as unread',
  icon: 'i-lucide-check-circle'
}, {
  label: 'Mark as important',
  icon: 'i-lucide-triangle-alert'
}], [{
  label: 'Star thread',
  icon: 'i-lucide-star'
}, {
  label: 'Mute thread',
  icon: 'i-lucide-circle-pause'
}]]

const toast = useToast()

const reply = ref('')
const loading = ref(false)

function onSubmit() {
  loading.value = true

  setTimeout(() => {
    reply.value = ''

    toast.add({
      title: 'Email sent',
      description: 'Your email has been sent successfully',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })

    loading.value = false
  }, 1000)
}
</script>

<template>
  <UDashboardPanel id="inbox-2">
    <UDashboardNavbar :title="mail.subject" :toggle="false">
      <template #leading>
        <UButton
          class="-ms-1.5"
          color="neutral"
          icon="i-lucide-x"
          variant="ghost"
          @click="emits('close')"
        />
      </template>

      <template #right>
        <UTooltip text="Archive">
          <UButton
            color="neutral"
            icon="i-lucide-inbox"
            variant="ghost"
          />
        </UTooltip>

        <UTooltip text="Reply">
          <UButton color="neutral" icon="i-lucide-reply" variant="ghost" />
        </UTooltip>

        <UDropdownMenu :items="dropdownItems">
          <UButton
            color="neutral"
            icon="i-lucide-ellipsis-vertical"
            variant="ghost"
          />
        </UDropdownMenu>
      </template>
    </UDashboardNavbar>

    <div class="flex flex-col sm:flex-row justify-between gap-1 p-4 sm:px-6 border-b border-default">
      <div class="flex items-start gap-4 sm:my-1.5">
        <UAvatar
          :alt="mail.from.name"
          size="3xl"
          v-bind="mail.from.avatar"
        />

        <div class="min-w-0">
          <p class="font-semibold text-highlighted">
            {{ mail.from.name }}
          </p>
          <p class="text-muted">
            {{ mail.from.email }}
          </p>
        </div>
      </div>

      <p class="max-sm:pl-16 text-muted text-sm sm:mt-2">
        {{ format(new Date(mail.date), 'dd MMM HH:mm') }}
      </p>
    </div>

    <div class="flex-1 p-4 sm:p-6 overflow-y-auto">
      <p class="whitespace-pre-wrap">
        {{ mail.body }}
      </p>
    </div>

    <div class="pb-4 px-4 sm:px-6 shrink-0">
      <UCard :ui="{ header: 'flex items-center gap-1.5 text-dimmed' }" class="mt-auto" variant="subtle">
        <template #header>
          <UIcon class="size-5" name="i-lucide-reply" />

          <span class="text-sm truncate">
            Reply to {{ mail.from.name }} ({{ mail.from.email }})
          </span>
        </template>

        <form @submit.prevent="onSubmit">
          <UTextarea
            v-model="reply"
            :disabled="loading"
            :rows="4"
            :ui="{ base: 'p-0 resize-none' }"
            autoresize
            class="w-full"
            color="neutral"
            placeholder="Write your reply..."
            required
            variant="none"
          />

          <div class="flex items-center justify-between">
            <UTooltip text="Attach file">
              <UButton
                color="neutral"
                icon="i-lucide-paperclip"
                variant="ghost"
              />
            </UTooltip>

            <div class="flex items-center justify-end gap-2">
              <UButton
                color="neutral"
                label="Save draft"
                variant="ghost"
              />
              <UButton
                :loading="loading"
                color="neutral"
                icon="i-lucide-send"
                label="Send"
                type="submit"
              />
            </div>
          </div>
        </form>
      </UCard>
    </div>
  </UDashboardPanel>
</template>
