import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";

function TicketPage() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/tickets/${ticketId}`);
        setTicket(res.data);
      } catch (err) {
        console.error(err);
        setError("Не вдалося завантажити квиток");
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Ваш квиток</h2>
        <p className="page-subtitle">
          Підтвердження покупки. Ці дані вже враховані в модулі аналітики.
        </p>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        {loading && <p className="text-muted">Завантаження квитка…</p>}
        {error && <p className="text-error">{error}</p>}
        {!loading && !error && !ticket && (
          <p className="text-muted">Квиток не знайдено.</p>
        )}

        {ticket && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div>
                <div className="card-title">
                  Квиток #{ticket.id}
                </div>
                <div className="card-caption">
                  Статус:{" "}
                  <span
                    style={{
                      color:
                        ticket.status === "paid"
                          ? "var(--success)"
                          : "var(--text-muted)",
                    }}
                  >
                    {ticket.status}
                  </span>
                </div>
              </div>
              <span className="chip">
                <span>💾</span>Записано в БД
              </span>
            </div>

            <div className="card-soft" style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div>
                  <div className="card-caption">Пасажир</div>
                  <div style={{ fontSize: 15 }}>
                    {ticket.passenger_name}
                  </div>
                </div>
                <div>
                  <div className="card-caption">Місце</div>
                  <div style={{ fontSize: 15 }}>
                    {ticket.seat_number}
                  </div>
                </div>
                <div>
                  <div className="card-caption">Ціна</div>
                  <div style={{ fontSize: 15 }}>
                    {ticket.price} ₴
                  </div>
                </div>
              </div>
            </div>

            <div className="card-soft" style={{ marginBottom: 10 }}>
              <div className="card-caption">Технічні дані</div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "6px 0 0",
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}
              >
                <li>Trip ID: {ticket.trip_id}</li>
                <li>Дата покупки: {new Date(ticket.created_at).toLocaleString()}</li>
                <li>Ticket ID: {ticket.id}</li>
              </ul>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 10,
              }}
            >
              <Link to="/" className="btn btn-ghost">
                ← Новий пошук
              </Link>
              <Link to="/analytics" className="btn btn-outlined">
                Відкрити аналітику
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default TicketPage;
