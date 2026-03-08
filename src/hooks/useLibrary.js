import toast from 'react-hot-toast'
import { useLibraryStore } from '../store/libraryStore.js'

// Drop-in replacements — same API as the React Query versions
// so all pages work without any changes

export function useLibrary(status) {
  const entries = useLibraryStore((s) => s.entries)
  const data    = status ? entries.filter((e) => e.readingStatus === status) : entries
  return { data, isLoading: false, isError: false }
}

export function useAddToLibrary() {
  const addEntry = useLibraryStore((s) => s.addEntry)

  const mutate = (payload, options = {}) => {
    // payload may come from AddManhwaForm (title + status) or DiscoverPage (full mangadex object)
    const manhwaData = {
      id:          payload.mangadexId ?? payload.manhwaId ?? payload.id ?? null,
      title:       payload.title,
      coverUrl:    payload.coverUrl    ?? null,
      author:      payload.author      ?? 'Unknown',
      genres:      payload.genres      ?? [],
      status:      payload.status      ?? 'ongoing',
      description: payload.description ?? '',
      mangadexId:  payload.mangadexId  ?? '',
    }
    const result = addEntry(manhwaData, payload.readingStatus ?? 'WANT_TO_READ')
    if (result.ok) {
      toast.success('Added to your library!')
      options.onSuccess?.()
    } else {
      toast.error(result.message ?? 'Could not add manhwa')
      options.onError?.()
    }
  }

  return { mutate, isPending: false }
}

export function useUpdateLibraryEntry() {
  const updateEntry = useLibraryStore((s) => s.updateEntry)

  const mutate = ({ entryId, ...patch }, options = {}) => {
    updateEntry(entryId, patch)
    toast.success('Entry updated!')
    options.onSuccess?.()
  }

  return { mutate, isPending: false }
}

export function useRemoveFromLibrary() {
  const removeEntry = useLibraryStore((s) => s.removeEntry)

  const mutate = (entryId, options = {}) => {
    removeEntry(entryId)
    toast.success('Removed from library')
    options.onSuccess?.()
  }

  return { mutate, isPending: false }
}
