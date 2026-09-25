import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'

export const USER_KEY = ['user']

/** 앱 전체에서 공유되는 유저 데이터 캐시 */
export function useUser() {
  return useQuery({
    queryKey: USER_KEY,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase.from('users').select('*').eq('auth_id', user.id).single()
      return data
    },
  })
}

/** coin/energy 변동 후 캐시 무효화 */
export function useRefreshUser() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: USER_KEY })
}
