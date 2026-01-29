import { useMutation, useQueryClient } from '@tanstack/react-query'
import { backendRpc } from '@/lib/backend-rpc'

interface UploadImageOptions {
  endpoint: string
  id: number
  invalidateKey: string[]
}

export function useImageUpload({ endpoint, id, invalidateKey }: UploadImageOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}/${id}/upload-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Upload failed')
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey })
    },
  })
}
