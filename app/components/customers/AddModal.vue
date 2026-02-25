<script lang="ts" setup>
import * as z from 'zod'
import type {FormSubmitEvent} from '@nuxt/ui'

const schema = z.object({
  name: z.string().min(2, 'Too short'),
  email: z.string().email('Invalid email')
})
const open = ref(false)

type Schema = z.infer<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  email: ''
})

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  toast.add({title: 'Success', description: `New customer ${event.data.name} added`, color: 'success'})
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" description="Add a new customer to the database" title="New customer">
    <UButton icon="i-lucide-plus" label="New customer"/>

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name" placeholder="John Doe">
          <UInput v-model="state.name" class="w-full"/>
        </UFormField>
        <UFormField label="Email" name="email" placeholder="john.doe@example.com">
          <UInput v-model="state.email" class="w-full"/>
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            label="Cancel"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            color="primary"
            label="Create"
            type="submit"
            variant="solid"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
