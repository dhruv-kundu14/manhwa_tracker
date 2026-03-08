// MOCK — friends need backend/Firebase, return empty for now
export function useFriends()        { return { data: [], isLoading: false } }
export function useFriendRequests() { return { data: [], isLoading: false } }
export function useSearchUsers()    { return { data: [], isLoading: false } }
export function useSendRequest()    { return { mutate: () => {}, isPending: false } }
export function useRespondRequest() { return { mutate: () => {}, isPending: false } }
export function useRemoveFriend()   { return { mutate: () => {}, isPending: false } }
export function useFriendLibrary()  { return { data: null, isLoading: false } }
