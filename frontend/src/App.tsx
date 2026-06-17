import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { HomePage } from '@/pages/HomePage'
import { PastePage } from '@/pages/PastePage'
import { KafkaPage } from '@/pages/KafkaPage'
import { ReplayPage } from '@/pages/ReplayPage'
import { ComparePage } from '@/pages/ComparePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { MessagePage } from '@/pages/MessagePage'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/paste" element={<PastePage />} />
        <Route path="/kafka" element={<KafkaPage />} />
        <Route path="/message/:id" element={<MessagePage />} />
        <Route path="/replay" element={<ReplayPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  )
}
