import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import DailyEntryForm from './components/DailyEntryForm';
import HistoryDashboard from './components/HistoryDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={
            <>
              <DailyEntryForm />
              <HistoryDashboard />
            </>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
