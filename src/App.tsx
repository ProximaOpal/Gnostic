import { Route, Switch, Redirect } from 'wouter';
import { StoreProvider, useStore } from '@/context/StoreContext';
import { AuthPage } from '@/pages/Auth';
import { HomePage } from '@/pages/Home';
import { DiaryPage } from '@/pages/Diary';
import { NotesPage } from '@/pages/Notes';
import { PsychePage } from '@/pages/Psyche';
import { SearchPage } from '@/pages/Search';
import { TrendsPage } from '@/pages/Trends';
import { YouPage } from '@/pages/You';

function Routes() {
  const { user, toastMsg } = useStore();
  if (!user) return <AuthPage />;
  return (
    <>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/diary" component={DiaryPage} />
        <Route path="/notes" component={NotesPage} />
        <Route path="/psyche" component={PsychePage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/trends" component={TrendsPage} />
        <Route path="/you" component={YouPage} />
        <Route><Redirect to="/" /></Route>
      </Switch>
      <div className={`gx-toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Routes />
    </StoreProvider>
  );
}
