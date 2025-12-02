import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import RouteCalendar from "../components/RouteCalendar";

function SearchTripsPage() {
  const [stations, setStations] = useState([]);
  const [fromStationId, setFromStationId] = useState("");
  const [toStationId, setToStationId] = useState("");
  const [travelDate, setTravelDate] = useState(""); // формат YYYY-MM-DD

  const [availableDates, setAvailableDates] = useState([]);
  const [loadingAvailableDates, setLoadingAvailableDates] = useState(false);

  const [trips, setTrips] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [error, setError] = useState("");

  const [selectedTripId, setSelectedTripId] = useState(null);
  const [passengerName, setPassengerName] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState("");

  const navigate = useNavigate();

  // 1. Завантажуємо станції
  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoadingStations(true);
        const res = await api.get("/stations/");
        setStations(res.data);
      } catch (err) {
        console.error(err);
        setError("Не вдалося завантажити станції");
      } finally {
        setLoadingStations(false);
      }
    };

    fetchStations();
  }, []);

  // 2. Коли змінюється маршрут (from/to) — оновлюємо список доступних дат
  useEffect(() => {
    const fetchAvailableDates = async () => {
      setAvailableDates([]);
      setTravelDate("");
      setTrips([]);
      setSelectedTripId(null);
      setError("");

      if (!fromStationId || !toStationId) {
        return;
      }

      try {
        setLoadingAvailableDates(true);
        const res = await api.get("/trips/available-dates", {
          params: {
            start_station_id: fromStationId,
            end_station_id: toStationId,
          },
        });
        setAvailableDates(res.data.dates || []);
        if ((res.data.dates || []).length === 0) {
          setError(
            "Для обраного маршруту немає жодного рейсу. Спробуйте інший напрямок."
          );
        }
      } catch (err) {
        console.error(err);
        setError("Не вдалося завантажити доступні дати для маршруту");
      } finally {
        setLoadingAvailableDates(false);
      }
    };

    fetchAvailableDates();
  }, [fromStationId, toStationId]);

  // 3. Запит рейсів по обраному дню
  const loadTripsForSelectedDate = async (dateStr) => {
    if (!fromStationId || !toStationId || !dateStr) return;
    try {
      setLoadingTrips(true);
      setError("");
      setTrips([]);
      setSelectedTripId(null);

      const res = await api.get("/trips/", {
        params: {
          start_station_id: fromStationId,
          end_station_id: toStationId,
          travel_date: dateStr,
        },
      });

      setTrips(res.data);
      if (res.data.length === 0) {
        setError("На цю дату рейсів не знайдено");
      }
    } catch (err) {
      console.error(err);
      setError("Помилка при завантаженні рейсів");
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleSelectTrip = (tripId) => {
    setSelectedTripId(tripId);
    setPassengerName("");
    setSeatNumber("");
    setBuyError("");
  };

  const handleBuyTicket = async (e) => {
    e.preventDefault();
    if (!selectedTripId || !passengerName || !seatNumber) {
      setBuyError("Заповніть всі поля для покупки квитка");
      return;
    }
    setBuyError("");
    setBuying(true);

    try {
      const trip = trips.find((t) => t.id === selectedTripId);
      const price = trip?.base_price ?? 0;

      const res = await api.post("/tickets/", {
        trip_id: selectedTripId,
        passenger_name: passengerName,
        seat_number: seatNumber,
        price,
      });

      const ticket = res.data;
      navigate(`/ticket/${ticket.id}`);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.detail) {
        setBuyError(err.response.data.detail);
      } else {
        setBuyError("Помилка при покупці квитка");
      }
    } finally {
      setBuying(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Продаж залізничних квитків</h2>
        <p className="page-subtitle">
          Спочатку оберіть напрямок, потім дату з календаря доступних рейсів,
          після чого оформіть квиток.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
        }}
      >
        {/* Ліва колонка — маршрут + календар + результати */}
        <div style={{ display: "grid", gap: 16 }}>
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
                alignItems: "center",
              }}
            >
              <div>
                <div className="card-title">Напрямок та дата поїздки</div>
                <div className="card-caption">
                  Система покаже в календарі лише ті дні, коли є рейси на
                  обраному маршруті.
                </div>
              </div>
              <span className="chip">
                <span>🗓️</span>Календар рейсів
              </span>
            </div>

            {error && <p className="text-error">{error}</p>}

            <div className="form-grid" style={{ marginTop: 8 }}>
              <div className="form-row-2">
                <label className="form-label">
                  <span>Звідки</span>
                  <select
                    value={fromStationId}
                    onChange={(e) => setFromStationId(e.target.value)}
                    disabled={loadingStations}
                  >
                    <option value="">Оберіть станцію</option>
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-label">
                  <span>Куди</span>
                  <select
                    value={toStationId}
                    onChange={(e) => setToStationId(e.target.value)}
                    disabled={loadingStations}
                  >
                    <option value="">Оберіть станцію</option>
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="card-soft" style={{ marginTop: 4 }}>
                <div className="card-caption" style={{ marginBottom: 6 }}>
                  Оберіть дату прямо в календарі. Клік активний лише для днів з
                  доступними рейсами.
                </div>
                {loadingAvailableDates ? (
                  <p className="text-muted" style={{ fontSize: 13 }}>
                    Завантаження календаря для обраного маршруту…
                  </p>
                ) : (
                  <RouteCalendar
                    availableDates={availableDates}
                    selectedDate={travelDate}
                    onSelectDate={(dateStr) => {
                      setTravelDate(dateStr);
                      loadTripsForSelectedDate(dateStr);
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="card-soft">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                alignItems: "center",
              }}
            >
              <div>
                <div className="card-title">Рейси на обрану дату</div>
                <div className="card-caption">
                  Після вибору дати в календарі тут зʼявляться доступні рейси.
                </div>
              </div>
            </div>

            {loadingTrips && (
              <p className="text-muted">Завантаження рейсів…</p>
            )}

            {!loadingTrips && trips.length > 0 && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Маршрут</th>
                      <th>Відправлення</th>
                      <th>Прибуття</th>
                      <th>Базова ціна</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((trip) => (
                      <tr key={trip.id}>
                        <td>{trip.id}</td>
                        <td>
                          <span className="text-muted">
                            route_id: {trip.route_id}
                          </span>
                        </td>
                        <td>
                          {new Date(
                            trip.departure_time
                          ).toLocaleString()}
                        </td>
                        <td>
                          {new Date(trip.arrival_time).toLocaleString()}
                        </td>
                        <td>{trip.base_price}</td>
                        <td>
                          <button
                            className="btn btn-outlined"
                            onClick={() => handleSelectTrip(trip.id)}
                          >
                            Обрати
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loadingTrips && !trips.length && travelDate && !error && (
              <p className="text-muted">
                На обрану дату рейсів не знайдено.
              </p>
            )}

            {!loadingTrips && !trips.length && !travelDate && (
              <p className="text-muted">
                Спочатку оберіть маршрут і дату в календарі.
              </p>
            )}
          </div>
        </div>

        {/* Права колонка — оформлення квитка */}
        <div>
          <div className="card">
            <div className="card-title">Оформлення квитка</div>
            <div className="card-caption">
              Оберіть рейс зліва, а потім заповніть дані пасажира.
            </div>

            {!selectedTripId && (
              <p
                className="text-muted"
                style={{ marginTop: 12, fontSize: 13 }}
              >
                Рейс ще не обрано. Натисніть кнопку «Обрати» у таблиці з
                рейсами.
              </p>
            )}

            {selectedTripId && (
              <>
                <div
                  style={{
                    marginTop: 10,
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span className="chip">
                    <span>Рейс #{selectedTripId}</span>
                  </span>
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    Дані продажу підуть в модуль аналітики.
                  </span>
                </div>

                {buyError && <p className="text-error">{buyError}</p>}

                <form
                  onSubmit={handleBuyTicket}
                  className="form-grid"
                  style={{ marginTop: 8 }}
                >
                  <label className="form-label">
                    <span>Ім&apos;я пасажира</span>
                    <input
                      type="text"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      placeholder="Наприклад, Іван Петренко"
                    />
                  </label>
                  <label className="form-label">
                    <span>Номер місця</span>
                    <input
                      type="text"
                      value={seatNumber}
                      onChange={(e) => setSeatNumber(e.target.value)}
                      placeholder="Напр. 12A"
                    />
                  </label>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 4,
                    }}
                  >
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={buying}
                    >
                      {buying ? "Оформлення..." : "Купити квиток"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default SearchTripsPage;
