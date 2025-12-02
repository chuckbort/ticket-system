from datetime import datetime, timedelta, time as dtime, date

from app.database import SessionLocal
from app import models


def reset_data(db):
    """
    Очищаємо всі таблиці, щоб не було дублювань.
    Порядок важливий через зовнішні ключі.
    """
    db.query(models.Ticket).delete()
    db.query(models.Trip).delete()
    db.query(models.Route).delete()
    db.query(models.Train).delete()
    db.query(models.Station).delete()
    db.commit()


def seed():
    db = SessionLocal()
    try:
        reset_data(db)

        # ---------- СТАНЦІЇ ----------
        stations_data = [
            {"name": "Київ", "code": "KYIV"},
            {"name": "Львів", "code": "LVIV"},
            {"name": "Одеса", "code": "ODESA"},
            {"name": "Харків", "code": "KHARKIV"},
            {"name": "Дніпро", "code": "DNIPRO"},
        ]

        station_objs = []
        for s in stations_data:
            st = models.Station(name=s["name"], code=s["code"])
            db.add(st)
            station_objs.append(st)
        db.commit()
        db.refresh(station_objs[0])  # просто щоб вони були "прив'язані" до сесії

        # робимо зручний dict code -> Station
        stations_by_code = {s.code: s for s in station_objs}

        # ---------- ПОЇЗДИ ----------
        trains_data = [
            {"number": "091К", "name": "Київ — Львів нічний"},
            {"number": "092Л", "name": "Львів — Київ нічний"},
            {"number": "105К", "name": "Київ — Одеса експрес"},
            {"number": "706Х", "name": "Київ — Харків Інтерсіті"},
            {"number": "732Д", "name": "Київ — Дніпро Інтерсіті"},
        ]

        train_objs = []
        for t in trains_data:
            tr = models.Train(number=t["number"], name=t["name"])
            db.add(tr)
            train_objs.append(tr)
        db.commit()

        trains_by_number = {t.number: t for t in train_objs}

        # ---------- МАРШРУТИ ----------
        routes_data = [
            ("KYIV", "LVIV"),
            ("LVIV", "KYIV"),
            ("KYIV", "ODESA"),
            ("KYIV", "KHARKIV"),
            ("KYIV", "DNIPRO"),
        ]

        route_objs = []
        for start_code, end_code in routes_data:
            r = models.Route(
                start_station_id=stations_by_code[start_code].id,
                end_station_id=stations_by_code[end_code].id,
            )
            db.add(r)
            route_objs.append(r)
        db.commit()

        # Для зручності: список маршрутів
        # (в тому ж порядку, що й routes_data)
        routes_list = route_objs

        # ---------- РЕЙСИ (TRIPS) ----------
        # Візьмемо "сьогодні" як базову дату
        today = date.today()

        trips = []

        def make_dt(day_offset: int, hour: int, minute: int):
            d = today + timedelta(days=day_offset)
            return datetime.combine(d, dtime(hour=hour, minute=minute))

        # Створимо кілька рейсів на різні дні
        trips_data = [
            # Київ — Львів, різні дні
            {
                "route": routes_list[0],
                "train": trains_by_number["091К"],
                "dep": make_dt(-5, 22, 30),
                "arr": make_dt(-4, 6, 30),
                "base_price": 700.0,
            },
            {
                "route": routes_list[0],
                "train": trains_by_number["091К"],
                "dep": make_dt(-3, 22, 30),
                "arr": make_dt(-2, 6, 30),
                "base_price": 750.0,
            },
            {
                "route": routes_list[0],
                "train": trains_by_number["091К"],
                "dep": make_dt(-1, 22, 30),
                "arr": make_dt(0, 6, 30),
                "base_price": 800.0,
            },

            # Львів — Київ
            {
                "route": routes_list[1],
                "train": trains_by_number["092Л"],
                "dep": make_dt(-4, 23, 0),
                "arr": make_dt(-3, 7, 0),
                "base_price": 680.0,
            },
            {
                "route": routes_list[1],
                "train": trains_by_number["092Л"],
                "dep": make_dt(-2, 23, 0),
                "arr": make_dt(-1, 7, 0),
                "base_price": 720.0,
            },

            # Київ — Одеса
            {
                "route": routes_list[2],
                "train": trains_by_number["105К"],
                "dep": make_dt(-7, 8, 0),
                "arr": make_dt(-7, 15, 0),
                "base_price": 900.0,
            },
            {
                "route": routes_list[2],
                "train": trains_by_number["105К"],
                "dep": make_dt(-1, 8, 0),
                "arr": make_dt(-1, 15, 0),
                "base_price": 950.0,
            },

            # Київ — Харків
            {
                "route": routes_list[3],
                "train": trains_by_number["706Х"],
                "dep": make_dt(-6, 6, 0),
                "arr": make_dt(-6, 11, 0),
                "base_price": 650.0,
            },
            {
                "route": routes_list[3],
                "train": trains_by_number["706Х"],
                "dep": make_dt(-2, 6, 0),
                "arr": make_dt(-2, 11, 0),
                "base_price": 700.0,
            },

            # Київ — Дніпро
            {
                "route": routes_list[4],
                "train": trains_by_number["732Д"],
                "dep": make_dt(-5, 7, 30),
                "arr": make_dt(-5, 12, 30),
                "base_price": 600.0,
            },
            {
                "route": routes_list[4],
                "train": trains_by_number["732Д"],
                "dep": make_dt(-1, 7, 30),
                "arr": make_dt(-1, 12, 30),
                "base_price": 650.0,
            },
        ]

        trip_objs = []
        for td in trips_data:
            trip = models.Trip(
                route_id=td["route"].id,
                train_id=td["train"].id,
                departure_time=td["dep"],
                arrival_time=td["arr"],
                base_price=td["base_price"],
            )
            db.add(trip)
            trip_objs.append(trip)
        db.commit()

        # ---------- КВИТКИ (TICKETS) ----------
        # Для кожного рейсу зробимо кілька квитків з різними created_at,
        # щоб аналітика по днях та станціях була цікавіша.

        passenger_names = [
            "Іван Петренко",
            "Олена Коваль",
            "Марія Іванченко",
            "Андрій Шевченко",
            "Світлана Бондар",
            "Тарас Каюк",
            "Оксана Литвин",
            "Михайло Гринюк",
        ]

        ticket_id_counter = 1

        for idx, trip in enumerate(trip_objs):
            # трохи варіюємо кількість квитків
            num_tickets = 5 + (idx % 6)  # від 5 до 10

            for i in range(num_tickets):
                passenger = passenger_names[(idx + i) % len(passenger_names)]
                seat_number = f"{10 + i}"
                # ціна: базова + невеличка надбавка
                price = trip.base_price + (i * 15)

                # зробимо created_at за 1–3 дні до відправлення
                created_at = trip.departure_time - timedelta(days=(i % 3 + 1))

                ticket = models.Ticket(
                    trip_id=trip.id,
                    passenger_name=passenger,
                    seat_number=seat_number,
                    price=price,
                    status="paid",
                    created_at=created_at,
                )
                db.add(ticket)
                ticket_id_counter += 1

        db.commit()
        print("✅ База успішно наповнена тестовими даними.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
