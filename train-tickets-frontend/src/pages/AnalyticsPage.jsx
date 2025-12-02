import { useEffect, useState } from "react";
import { api } from "../api/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";


function AnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [byDay, setByDay] = useState([]);
  const [byRoute, setByRoute] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [stations, setStations] = useState([]);

  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [filterFromStation, setFilterFromStation] = useState("");
  const [filterToStation, setFilterToStation] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [error, setError] = useState("");
  const [byDirection, setByDirection] = useState([]);
  const pieColors = [
    "#6366f1",
    "#a855f7",
    "#22c55e",
    "#f97316",
    "#06b6d4",
    "#e11d48",
    "#facc15",
  ];



  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoadingStations(true);
        const res = await api.get("/stations/");
        setStations(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStations(false);
      }
    };
    fetchStations();
  }, []);

    const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (filterFromDate) params.date_from = filterFromDate;
      if (filterToDate) params.date_to = filterToDate;
      if (filterFromStation) params.start_station_id = filterFromStation;
      if (filterToStation) params.end_station_id = filterToStation;

      const [summaryRes, byDayRes, byRouteRes, byDirectionRes, ticketsRes] =
        await Promise.all([
          api.get("/analytics/summary", { params }),
          api.get("/analytics/by-day", { params }),
          api.get("/analytics/by-route", { params }),
          api.get("/analytics/by-direction", { params }),
          api.get("/analytics/tickets", { params }),
        ]);

      setSummary(summaryRes.data);
      setByDay(byDayRes.data);
      setByRoute(byRouteRes.data);
      setByDirection(byDirectionRes.data);
      setTickets(ticketsRes.data);
    } catch (err) {
      console.error(err);
      setError("Не вдалося завантажити аналітику");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchAnalytics();
  };

  const handleResetFilters = () => {
    setFilterFromDate("");
    setFilterToDate("");
    setFilterFromStation("");
    setFilterToStation("");
    fetchAnalytics();
  };

  const getStationName = (id) => {
    const st = stations.find((s) => s.id === id);
    if (!st) return `ID ${id}`;
    return `${st.name} (${st.code})`;
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Аналітика продажів</h2>
        <p className="page-subtitle">
          Переглядай агреговані показники, динаміку продажів та деталізацію
          по кожному квитку з гнучкими фільтрами.
        </p>
      </div>

      {/* ФІЛЬТРИ */}
      <form
        onSubmit={handleApplyFilters}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div className="card-soft">
          <div className="card-title" style={{ marginBottom: 8 }}>
            Фільтри по даті покупки
          </div>
          <div className="form-grid">
            <label className="form-label">
              <span>З дати</span>
              <input
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
              />
            </label>
            <label className="form-label">
              <span>По дату</span>
              <input
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="card-soft">
          <div className="card-title" style={{ marginBottom: 8 }}>
            Фільтри по станціях
          </div>
          <div className="form-grid">
            <label className="form-label">
              <span>Станція відправлення</span>
              <select
                value={filterFromStation}
                onChange={(e) => setFilterFromStation(e.target.value)}
                disabled={loadingStations}
              >
                <option value="">Усі</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </label>

            <label className="form-label">
              <span>Станція прибуття</span>
              <select
                value={filterToStation}
                onChange={(e) => setFilterToStation(e.target.value)}
                disabled={loadingStations}
              >
                <option value="">Усі</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div
          className="card-soft"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div className="card-title">Керування фільтрами</div>
            <div className="card-caption">
              Застосуй або скинь фільтри, щоб оновити графіки й таблиці.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Застосувати
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleResetFilters}
              disabled={loading}
            >
              Скинути
            </button>
          </div>
        </div>
      </form>

      {loading && <p className="text-muted">Оновлення аналітики…</p>}
      {error && <p className="text-error">{error}</p>}

      {/* SUMMARY */}
      {summary && (
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <SummaryCard
            title="Продано квитків"
            value={summary.total_tickets}
          />
          <SummaryCard
            title="Дохід"
            value={summary.total_revenue.toFixed(2) + " ₴"}
          />
          <SummaryCard
            title="Середня ціна"
            value={summary.avg_price.toFixed(2) + " ₴"}
          />
          <SummaryCard
            title="Маршрутів з продажами"
            value={summary.routes_sold}
          />
        </div>
      )}

      {/* ГРАФІКИ */}
      {/* ГРАФІКИ */}
      <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
        {byDay.length > 0 && (
          <div className="card-soft">
            <div className="card-title">Продажі за днями</div>
            <div className="card-caption" style={{ marginBottom: 8 }}>
              Динаміка кількості квитків та доходу за кожен день.
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tickets" name="Квитків" />
                <Line type="monotone" dataKey="revenue" name="Дохід" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {byRoute.length > 0 && (
          <div className="card-soft">
            <div className="card-title">Продажі за маршрутами</div>
            <div className="card-caption" style={{ marginBottom: 8 }}>
              Кількість квитків та дохід в розрізі route_id.
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byRoute}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="route_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tickets" name="Квитків" />
                <Bar dataKey="revenue" name="Дохід" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {byDirection.length > 0 && (
          <div className="card-soft">
            <div className="card-title">Структура продажів за напрямками</div>
            <div className="card-caption" style={{ marginBottom: 8 }}>
              Частка напрямків за кількістю квитків та за доходом.
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
                alignItems: "center",
              }}
            >
              {/* Підготовка даних з назвами напрямків */}
              {(() => {
                const dataWithLabels = byDirection.map((d) => ({
                  ...d,
                  direction: `${getStationName(
                    d.start_station_id
                  )} → ${getStationName(d.end_station_id)}`,
                }));

                return (
                  <>
                    <div>
                      <div
                        className="card-caption"
                        style={{ marginBottom: 4 }}
                      >
                        За кількістю квитків
                      </div>
                      <ResponsiveContainer width="100%" height={340}>
                        <PieChart>
                          <Pie
                            data={dataWithLabels}
                            dataKey="tickets"
                            nameKey="direction"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            labelLine={false}
                            label={({ percent }) =>
                              `${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {dataWithLabels.map((entry, index) => (
                              <Cell
                                key={`cell-tickets-${index}`}
                                fill={
                                  pieColors[index % pieColors.length]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <div
                        className="card-caption"
                        style={{ marginBottom: 4 }}
                      >
                        За доходом
                      </div>
                      <ResponsiveContainer width="100%" height={340}>
                        <PieChart>
                          <Pie
                            data={dataWithLabels}
                            dataKey="revenue"
                            nameKey="direction"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            labelLine={false}
                            label={({ percent }) =>
                              `${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {dataWithLabels.map((entry, index) => (
                              <Cell
                                key={`cell-revenue-${index}`}
                                fill={
                                  pieColors[index % pieColors.length]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>


      {/* ТАБЛИЦЯ КВИТКІВ */}
      <div className="card-soft">
        <div className="card-title">Таблиця куплених квитків</div>
        <div className="card-caption" style={{ marginBottom: 8 }}>
          Деталізований список усіх квитків, що відповідають обраним фільтрам.
        </div>
        {tickets.length === 0 ? (
          <p className="text-muted">
            Немає квитків за обраними фільтрами.
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID квитка</th>
                  <th>Дата покупки</th>
                  <th>Пасажир</th>
                  <th>Маршрут</th>
                  <th>Ціна</th>
                  <th>Статус</th>
                  <th>Trip ID</th>
                  <th>Route ID</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.ticket_id}>
                    <td>{t.ticket_id}</td>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
                    <td>{t.passenger_name}</td>
                    <td>
                      {getStationName(t.start_station_id)} →{" "}
                      {getStationName(t.end_station_id)}
                    </td>
                    <td>{t.price}</td>
                    <td>{t.status}</td>
                    <td>{t.trip_id}</td>
                    <td>{t.route_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="card-soft" style={{ minWidth: 180 }}>
      <div className="card-caption">{title}</div>
      <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

export default AnalyticsPage;
