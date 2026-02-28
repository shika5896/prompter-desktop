import { onMount } from 'solid-js'
import { Router, Route } from '@solidjs/router'
import settingsStore from './stores/settingsStore'
import MenuScreen from './screens/MenuScreen'
import EditScreen from './screens/EditScreen'
import DisplayScreen from './screens/DisplayScreen'
import SettingsScreen from './screens/SettingsScreen'

export default function App() {
  onMount(() => {
    settingsStore.load()
  })

  return (
    <Router>
      <Route path="/" component={MenuScreen} />
      <Route path="/edit" component={EditScreen} />
      <Route path="/display" component={DisplayScreen} />
      <Route path="/settings" component={SettingsScreen} />
    </Router>
  )
}
