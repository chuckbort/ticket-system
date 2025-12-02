from typing import List, Optional
from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app import schemas

router = APIRouter(
    prefix="/trips",
    tags=["trips"],
)


@router.post("/", response_model=schemas.Trip)
def create_trip(trip: schemas.TripCreate, db: Session = Depends(get_db)):
    """
    Створити рейс (конкретний виїзд поїзда за маршрутом в певний час).
    """
    # Перевіримо існування маршруту і поїзда
    route = db.query(models.Route).filter(models.Route.id == trip.route_id).first()
    train = db.query(models.Train).filter(models.Train.id == trip.train_id).first()
    if not route or not train:
        raise HTTPException(status_code=400, detail="Route or train does not exist")

    if trip.arrival_time <= trip.departure_time:
        raise HTTPException(status_code=400, detail="Arrival time must be after departure time")

    db_trip = models.Trip(
        route_id=trip.route_id,
        train_id=trip.train_id,
        departure_time=trip.departure_time,
        arrival_time=trip.arrival_time,
        base_price=trip.base_price,
    )
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip


@router.get("/", response_model=List[schemas.Trip])
def list_trips(
    db: Session = Depends(get_db),
    start_station_id: Optional[int] = None,
    end_station_id: Optional[int] = None,
    travel_date: Optional[date] = None,
):
    """
    Отримати список рейсів.
    Можна фільтрувати:
      - за станцією відправлення
      - за станцією прибуття
      - за датою виїзду (travel_date, без часу)
    """
    query = db.query(models.Trip)

    # Приєднуємо Route для фільтрації за станціями
    if start_station_id is not None or end_station_id is not None:
        query = query.join(models.Route)

        if start_station_id is not None:
            query = query.filter(models.Route.start_station_id == start_station_id)
        if end_station_id is not None:
            query = query.filter(models.Route.end_station_id == end_station_id)

    # Фільтр по даті (ігноруємо час)
    if travel_date is not None:
        start_dt = datetime.combine(travel_date, time.min)
        end_dt = start_dt + timedelta(days=1)
        query = query.filter(models.Trip.departure_time >= start_dt,
                             models.Trip.departure_time < end_dt)

    trips = query.all()
    return trips

@router.get("/available-dates")
def get_available_dates(
    start_station_id: int = Query(...),
    end_station_id: int = Query(...),
    db: Session = Depends(get_db),
):
    """
    Повертає список дат (YYYY-MM-DD), для яких існують рейси
    між двома станціями.
    """
    # Перевіряємо, що маршрут існує хоча б в одному рейсі
    query = (
        db.query(models.Trip)
        .join(models.Route, models.Trip.route_id == models.Route.id)
        .filter(
            models.Route.start_station_id == start_station_id,
            models.Route.end_station_id == end_station_id,
        )
    )

    trips = query.all()

    if not trips:
        return {"dates": []}

    unique_dates = sorted(
        {t.departure_time.date().isoformat() for t in trips}
    )

    return {"dates": unique_dates}
