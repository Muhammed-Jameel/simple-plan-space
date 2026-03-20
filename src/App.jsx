import { useState, useCallback } from 'react'
import { AuthProvider } from './Auth'
import { createStorage, syncLocalToSupabase, syncSupabaseToLocal } from './storage'
import FloorPlanStudio from './FloorPlanStudio'

export default function App() {
  const [userId, setUserId] = useState(null)
  const [storageKey, setStorageKey] = useState(0) // force re-mount on auth change

  const handleUserChange = useCallback(async (newUserId) => {
    if (newUserId && !userId) {
      // Just logged in — sync local data up, then pull cloud data down
      await syncLocalToSupabase(newUserId)
      await syncSupabaseToLocal(newUserId)
    }
    setUserId(newUserId)
    setStorageKey(k => k + 1) // force studio to re-init with new storage
  }, [userId])

  const storage = createStorage(userId)

  return (
    <AuthProvider onUserChange={handleUserChange}>
      <FloorPlanStudio key={storageKey} storage={storage} />
    </AuthProvider>
  )
}
