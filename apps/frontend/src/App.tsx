import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Traders from './pages/Traders';
import TraderDetails from './pages/TraderDetails';
import Masters from './pages/Masters';
import MasterDetails from './pages/MasterDetails';
import Slaves from './pages/Slaves';
import SlaveDetails from './pages/SlaveDetails';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import PropFirmProtection from './pages/PropFirmProtection';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="traders" element={<Traders />} />
          <Route path="traders/:id" element={<TraderDetails />} />
          <Route path="masters" element={<Masters />} />
          <Route path="masters/:id" element={<MasterDetails />} />
          <Route path="slaves" element={<Slaves />} />
          <Route path="slaves/:id" element={<SlaveDetails />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="prop-firm-protection" element={<PropFirmProtection />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
