from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app import schemas

router = APIRouter(
    prefix="/routes",
    tags=["routes"],
)


@router.post("/", response_model=schemas.Route)
def create_route(route: schemas.RouteCreate, db: Session = Depends(get_db)):
    """
    Створити маршрут між двома станціями.
    Приклад:
    {
      "start_station_id": 1,
      "end_station_id": 2
    }
    """
    # Перевіримо, чи існують станції
    start_station = db.query(models.Station).filter(models.Station.id == route.start_station_id).first()
    end_station = db.query(models.Station).filter(models.Station.id == route.end_station_id).first()

    if not start_station or not end_station:
        raise HTTPException(status_code=400, detail="Start or end station does not exist")

    db_route = models.Route(
        start_station_id=route.start_station_id,
        end_station_id=route.end_station_id,
    )
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route


@router.get("/", response_model=List[schemas.Route])
def list_routes(db: Session = Depends(get_db)):
    """
    Отримати список усіх маршрутів.
    """
    routes = db.query(models.Route).all()
    return routes
