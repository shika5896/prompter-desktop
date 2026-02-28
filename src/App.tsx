import { createSignal, onMount, Show } from 'solid-js'
import { Router, Route } from '@solidjs/router'
import settingsStore from './stores/settingsStore'
import EditScreen from './screens/EditScreen'
import DisplayScreen from './screens/DisplayScreen'
import SettingsScreen from './screens/SettingsScreen'

export default function App() {
  const [ready, setReady] = createSignal(false)

  onMount(async () => {
    await settingsStore.load()
    setReady(true)
  })

  return (
    <Show when={ready()}>
      <Router>
        <Route path="/" component={EditScreen} />
        <Route path="/display" component={DisplayScreen} />
        <Route path="/settings" component={SettingsScreen} />
      </Router>
    </Show>
  )
}
