import { useMemo } from "react";

/**
 * Простий календар одного місяця:
 * - показує всі дні місяця
 * - клікабельні тільки ті, що в availableDates
 * - обраний день підсвічується
 */
function RouteCalendar({ availableDates, selectedDate, onSelectDate }) {
  // availableDates: масив рядків 'YYYY-MM-DD'

  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);

  // Вирахуємо місяць для показу:
  // якщо є вибрана дата — беремо її місяць
  // інакше першу доступну дату
  const baseDate = useMemo(() => {
    const ref = selectedDate || (availableDates[0] || null);
    if (!ref) return null;
    return new Date(ref + "T00:00:00");
  }, [selectedDate, availableDates]);

  if (!baseDate) {
    return (
      <p className="text-muted" style={{ fontSize: 13 }}>
        Немає дат з доступними рейсами для обраного маршруту.
      </p>
    );
  }

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth(); // 0–11

  // перший день місяця
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay(); // 0 - неділя, 1 - понеділок, ...

  // нам зручніше, щоб 1 = понеділок, 7 = неділя
  const startOffset = (firstWeekday + 6) % 7; // 0..6

  // кількість днів у місяці
  const nextMonth = new Date(year, month + 1, 1);
  const lastDayOfMonth = new Date(nextMonth - 1);
  const daysInMonth = lastDayOfMonth.getDate();

  // Формуємо сітку з 6 рядків по 7 днів (максимум)
  const weeks = [];
  let currentDayNumber = 1 - startOffset;

  for (let week = 0; week < 6; week++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      let cellDate = null;
      let iso = null;
      if (currentDayNumber >= 1 && currentDayNumber <= daysInMonth) {
        cellDate = new Date(year, month, currentDayNumber);
        iso = cellDate.toISOString().substring(0, 10);
      }
      days.push({ label: cellDate ? currentDayNumber : "", iso });
      currentDayNumber++;
    }
    weeks.push(days);
  }

  const monthLabel = baseDate.toLocaleDateString("uk-UA", {
    month: "long",
    year: "numeric",
  });

  const weekdayShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 500 }}>{monthLabel}</div>
        <div className="text-muted" style={{ fontSize: 11 }}>
          Доступні дати: {availableDates.length}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          fontSize: 11,
          marginBottom: 4,
          color: "var(--text-muted)",
        }}
      >
        {weekdayShort.map((w) => (
          <div key={w} style={{ textAlign: "center" }}>
            {w}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
        }}
      >
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            if (!day.iso) {
              return (
                <div
                  key={`${wi}-${di}`}
                  style={{
                    height: 28,
                  }}
                />
              );
            }

            const isAvailable = availableSet.has(day.iso);
            const isSelected = selectedDate === day.iso;

            let bg = "transparent";
            let color = "var(--text-muted)";
            let border = "1px solid transparent";
            let cursor = "default";
            let opacity = 0.4;

            if (isAvailable) {
              opacity = 1;
              color = "var(--text-main)";
              border = "1px solid rgba(148, 163, 184, 0.4)";
              cursor = "pointer";
              bg = "rgba(15, 23, 42, 0.9)";
            }

            if (isSelected) {
              bg =
                "linear-gradient(135deg, var(--accent), var(--accent-strong))";
              color = "#fff";
              border = "1px solid rgba(191, 219, 254, 0.9)";
              cursor = "pointer";
            }

            return (
              <button
                key={`${wi}-${di}`}
                type="button"
                onClick={() => {
                  if (!isAvailable) return;
                  onSelectDate(day.iso);
                }}
                style={{
                  height: 28,
                  borderRadius: 999,
                  border,
                  background: bg,
                  color,
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity,
                }}
              >
                {day.label}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default RouteCalendar;
