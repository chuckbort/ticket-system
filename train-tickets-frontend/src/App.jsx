import { NavLink, Routes, Route } from "react-router-dom";
import SearchTripsPage from "./pages/SearchTripsPage";
import TicketPage from "./pages/TicketPage";
import AnalyticsPage from "./pages/AnalyticsPage";

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-badge">TT</div>
          <div className="app-logo-text">
            <span className="app-logo-text-main">TrainTickets</span>
            <span className="app-logo-text-sub">Sales & Analytics</span>
          </div>
        </div>

        <nav className="app-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="icon">🚆</span>
            <span>Продаж квитків</span>
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="icon">📊</span>
            <span>Аналітика</span>
          </NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<SearchTripsPage />} />
        <Route path="/ticket/:ticketId" element={<TicketPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </div>
  );
}

export default App;
