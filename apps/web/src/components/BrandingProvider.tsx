import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { applyBranding, defaultBranding, type BrandingSettings } from '@/lib/branding'

const BrandingContext = createContext<BrandingSettings>(defaultBranding)

interface BrandingProviderProps {
  children: ReactNode
}

export function BrandingProvider({ children }: BrandingProviderProps) {
  const brandingQuery = useQuery({
    queryKey: ['branding-public'],
    queryFn: () =>
      api
        .get<{ item: BrandingSettings }>('/branding/public')
        .then((response) => response.data.item),
    retry: 1,
  })

  const branding = brandingQuery.data ?? defaultBranding

  useEffect(() => {
    applyBranding(branding)
  }, [branding])

  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>
}

export function useBranding() {
  return useContext(BrandingContext)
}
