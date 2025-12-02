from datetime import date, datetime, time
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app import models

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
)


def _build_datetime_range(date_from: Optional[date], date_to: Optional[date]):
    dt_from = datetime.combine(date_from, time.min) if date_from else None
    dt_to = datetime.combine(date_to, time.max) if date_to else None
    return dt_from, dt_to


def _apply_filters(query, dt_from, dt_to, start_station_id, end_station_id):
    # вже є join з Trip і Route у всіх запитах
    if dt_from:
        query = query.filter(models.Ticket.created_at >= dt_from)
    if dt_to:
        query = query.filter(models.Ticket.created_at <= dt_to)
    if start_station_id:
        query = query.filter(models.Route.start_station_id == start_station_id)
    if end_station_id:
        query = query.filter(models.Route.end_station_id == end_station_id)
    return query


# ----------- SUMMARY -----------
@router.get("/summary")
def analytics_summary(
    db: Session = Depends(get_db),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    start_station_id: Optional[int] = None,
    end_station_id: Optional[int] = None,
):
    """
    Основні показники:
      - total_tickets: загальна кількість квитків
      - total_revenue: загальний дохід
      - avg_price: середня ціна квитка
      - routes_sold: кількість маршрутів з продажами
    З урахуванням фільтрів за датою покупки та станціями.
    """
    dt_from, dt_to = _build_datetime_range(date_from, date_to)

    base_query = (
        db.query(models.Ticket)
        .join(models.Trip, models.Trip.id == models.Ticket.trip_id)
        .join(models.Route, models.Route.id == models.Trip.route_id)
    )

    filtered = _apply_filters(base_query, dt_from, dt_to, start_station_id, end_station_id)

    total_tickets = filtered.count()
    total_revenue = filtered.with_entities(func.sum(models.Ticket.price)).scalar() or 0
    avg_price = filtered.with_entities(func.avg(models.Ticket.price)).scalar() or 0

    routes_sold = (
        db.query(models.Route.id)
        .join(models.Trip, models.Trip.route_id == models.Route.id)
        .join(models.Ticket, models.Ticket.trip_id == models.Trip.id)
    )
    routes_sold = _apply_filters(routes_sold, dt_from, dt_to, start_station_id, end_station_id)
    routes_sold = routes_sold.distinct().count()

    return {
        "total_tickets": total_tickets,
        "total_revenue": float(total_revenue),
        "avg_price": float(avg_price),
        "routes_sold": routes_sold,
    }


# ----------- BY DAY -----------
@router.get("/by-day")
def analytics_by_day(
    db: Session = Depends(get_db),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    start_station_id: Optional[int] = None,
    end_station_id: Optional[int] = None,
):
    """
    Дані для лінійного графіку:
      - date (YYYY-MM-DD)
      - tickets
      - revenue
    З урахуванням фільтрів.
    """
    dt_from, dt_to = _build_datetime_range(date_from, date_to)

    query = (
        db.query(
            func.date(models.Ticket.created_at).label("day"),
            func.count(models.Ticket.id).label("tickets"),
            func.sum(models.Ticket.price).label("revenue"),
        )
        .join(models.Trip, models.Trip.id == models.Ticket.trip_id)
        .join(models.Route, models.Route.id == models.Trip.route_id)
    )

    query = _apply_filters(query, dt_from, dt_to, start_station_id, end_station_id)

    query = (
        query.group_by(func.date(models.Ticket.created_at))
        .order_by(func.date(models.Ticket.created_at))
    )

    result = query.all()

    return [
        {
            "date": str(row.day),
            "tickets": row.tickets,
            "revenue": float(row.revenue or 0),
        }
        for row in result
    ]


# ----------- BY ROUTE (route_id) -----------
@router.get("/by-route")
def analytics_by_route(
    db: Session = Depends(get_db),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    start_station_id: Optional[int] = None,
    end_station_id: Optional[int] = None,
):
    """
    Дані для бар-чарту за маршрутами:
      - route_id
      - tickets
      - revenue
    З урахуванням фільтрів.
    """
    dt_from, dt_to = _build_datetime_range(date_from, date_to)

    query = (
        db.query(
            models.Route.id.label("route_id"),
            func.count(models.Ticket.id).label("tickets"),
            func.sum(models.Ticket.price).label("revenue"),
        )
        .join(models.Trip, models.Trip.route_id == models.Route.id)
        .join(models.Ticket, models.Ticket.trip_id == models.Trip.id)
    )

    query = _apply_filters(query, dt_from, dt_to, start_station_id, end_station_id)

    query = query.group_by(models.Route.id).order_by(models.Route.id)

    result = query.all()

    return [
        {
            "route_id": row.route_id,
            "tickets": row.tickets,
            "revenue": float(row.revenue or 0),
        }
        for row in result
    ]


# ----------- BY DIRECTION (start→end) -----------
@router.get("/by-direction")
def analytics_by_direction(
    db: Session = Depends(get_db),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    start_station_id: Optional[int] = None,
    end_station_id: Optional[int] = None,
):
    """
    Агрегація по напрямках (start_station_id, end_station_id):
      - start_station_id
      - end_station_id
      - tickets
      - revenue
    Використовується для кругових діаграм (pie chart).
    """
    dt_from, dt_to = _build_datetime_range(date_from, date_to)

    query = (
        db.query(
            models.Route.start_station_id.label("start_station_id"),
            models.Route.end_station_id.label("end_station_id"),
            func.count(models.Ticket.id).label("tickets"),
            func.sum(models.Ticket.price).label("revenue"),
        )
        .join(models.Trip, models.Trip.route_id == models.Route.id)
        .join(models.Ticket, models.Ticket.trip_id == models.Trip.id)
    )

    query = _apply_filters(query, dt_from, dt_to, start_station_id, end_station_id)

    query = (
        query.group_by(models.Route.start_station_id, models.Route.end_station_id)
        .order_by(models.Route.start_station_id, models.Route.end_station_id)
    )

    result = query.all()

    return [
        {
            "start_station_id": row.start_station_id,
            "end_station_id": row.end_station_id,
            "tickets": row.tickets,
            "revenue": float(row.revenue or 0),
        }
        for row in result
    ]


# ----------- TICKETS TABLE -----------
@router.get("/tickets")
def analytics_tickets(
    db: Session = Depends(get_db),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    start_station_id: Optional[int] = None,
    end_station_id: Optional[int] = None,
):
    """
    Таблиця з усіма квитками з фільтрами:
      - дата покупки (created_at)
      - станція відправлення
      - станція прибуття
    """
    dt_from, dt_to = _build_datetime_range(date_from, date_to)

    query = (
        db.query(models.Ticket, models.Trip, models.Route)
        .join(models.Trip, models.Trip.id == models.Ticket.trip_id)
        .join(models.Route, models.Route.id == models.Trip.route_id)
    )

    query = _apply_filters(query, dt_from, dt_to, start_station_id, end_station_id)

    rows = query.order_by(models.Ticket.created_at.desc()).all()

    tickets = []
    for ticket, trip, route in rows:
        tickets.append(
            {
                "ticket_id": ticket.id,
                "created_at": ticket.created_at.isoformat(),
                "price": float(ticket.price),
                "status": ticket.status,
                "passenger_name": ticket.passenger_name,
                "trip_id": trip.id,
                "route_id": route.id,
                "start_station_id": route.start_station_id,
                "end_station_id": route.end_station_id,
            }
        )

    return tickets


# ----------- TOP ROUTES -----------
@router.get("/top-routes")
def analytics_top_routes(
    db: Session = Depends(get_db),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    start_station_id: Optional[int] = None,
    end_station_id: Optional[int] = None,
):
    """
    Топ-5 маршрутів за кількістю проданих квитків (з урахуванням фільтрів).
    """
    dt_from, dt_to = _build_datetime_range(date_from, date_to)

    query = (
        db.query(
            models.Route.id.label("route_id"),
            func.count(models.Ticket.id).label("tickets"),
            func.sum(models.Ticket.price).label("revenue"),
        )
        .join(models.Trip, models.Trip.route_id == models.Route.id)
        .join(models.Ticket, models.Ticket.trip_id == models.Trip.id)
    )

    query = _apply_filters(query, dt_from, dt_to, start_station_id, end_station_id)

    query = (
        query.group_by(models.Route.id)
        .order_by(func.count(models.Ticket.id).desc())
        .limit(5)
    )

    result = query.all()

    return [
        {
            "route_id": row.route_id,
            "tickets": row.tickets,
            "revenue": float(row.revenue or 0),
        }
        for row in result
    ]
