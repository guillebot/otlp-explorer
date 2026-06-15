import { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { analyze } from './api'
import { CompareView, EncodingSelector, KafkaTopicBrowser, ParsedTree, PayloadInput, ReplayDialog, SignalSelector, SummaryCards, ValidationPanel } from './components'
import type { DecodedMessage } from './types'

function PastePage() {
  const [payload, setPayload] = useState('')
  const [encoding, setEncoding] = useState('auto')
  const [signal, setSignal] = useState('auto')
  const [message, setMessage] = useState<DecodedMessage>()
  const [problems, setProblems] = useState<string[]>([])
  const [error, setError] = useState('')

  async function onAnalyze() {
    setError('')
    try {
      const res = await analyze(payload, 'paste')
      setMessage(res.message)
      setProblems(res.problems)
    } catch (e) {
      setError(String(e))
    }
  }

  return (
    <div>
      <h2>Paste analyzer</h2>
      <div className="toolbar">
        <EncodingSelector value={encoding} onChange={setEncoding} />
        <SignalSelector value={signal} onChange={setSignal} />
        <button onClick={onAnalyze}>Analyze</button>
      </div>
      <PayloadInput value={payload} onChange={setPayload} />
      {error && <p>{error}</p>}
      {message && <SummaryCards msg={message} />}
      {problems.length > 0 && <ParsedTree value={problems} />}
      {message && <ValidationPanel results={message.validationResults} />}
    </div>
  )
}

function HomePage() {
  return <div><h2>Home dashboard</h2><p>Quick actions: Paste OTLP, Read from Kafka, Replay to Kafka, Upload file, Compare two messages.</p></div>
}

function KafkaPage() { return <div><h2>Kafka browser</h2><KafkaTopicBrowser topics={['otel-logs', 'otel-traces', 'otel-metrics']} /></div> }
function ReplayPage() { return <div><h2>Replay</h2><ReplayDialog onReplay={() => alert('Use API replay endpoint with confirm=true')} /></div> }
function ComparePage() { return <div><h2>Compare</h2><CompareView /></div> }
function SettingsPage() { return <div><h2>Settings</h2><p>Configure Kafka clusters and auth.</p></div> }
function MessagePage() { return <div><h2>Message details</h2><p>Select a message from dashboard or Kafka.</p></div> }

export default function App() {
  return (
    <div className="container">
      <header>
        <h1>OTLP Viewer</h1>
        <nav>
          <Link to="/">Home</Link> <Link to="/paste">Paste</Link> <Link to="/kafka">Kafka</Link> <Link to="/replay">Replay</Link> <Link to="/compare">Compare</Link> <Link to="/settings">Settings</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/paste" element={<PastePage />} />
        <Route path="/kafka" element={<KafkaPage />} />
        <Route path="/message/:id" element={<MessagePage />} />
        <Route path="/replay" element={<ReplayPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  )
}
