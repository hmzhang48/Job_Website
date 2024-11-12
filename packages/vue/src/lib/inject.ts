import type { Ref, InjectionKey } from 'vue'
export const infoKey = Symbol() as InjectionKey<Ref<Record<string, string>>>
export const corpKey = Symbol() as InjectionKey<Ref<Record<string, string>>>
export const hrListKey = Symbol() as InjectionKey<Ref<{ name: string, hrId: string, avatar: string }[]>>
export const updateKey = Symbol() as InjectionKey<( key: string, value: string ) => void>
export const resetKey = Symbol() as InjectionKey<() => void>
