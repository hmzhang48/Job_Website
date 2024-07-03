export const uploadImage = async (formData: FormData) =>
  fetch('/image',
    { method: 'POST', credentials: 'include', body: formData })
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: string } | undefined) => value?.result)
export const resetAvatar = async (formData: FormData, fileName: string) =>
  fetch('/image?fileName=' + fileName,
    { method: 'PATCH', credentials: 'include', body: formData })
    .then(response => (response.ok ? response.json() : undefined))
    .then((value: { result: string } | undefined) => value?.result)
