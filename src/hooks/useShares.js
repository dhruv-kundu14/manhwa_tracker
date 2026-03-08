// MOCK — shares need backend/Firebase, return empty for now
export function useSharesInbox()  { return { data: [], isLoading: false } }
export function useSharesSent()   { return { data: [], isLoading: false } }
export function useSendShare()    { return { mutate: () => {}, isPending: false } }
export function useMarkShareSeen(){ return { mutate: () => {} } }
export function useDeleteShare()  { return { mutate: () => {} } }
