from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app import schemas

router = APIRouter(
    prefix="/stations",
    tags=["stations"],
)


@router.post("/", response_model=schemas.Station)
def create_station(station: schemas.StationCreate, db: Session = Depends(get_db)):
    """
    Створити нову станцію.
    Приклад тіла запиту:
    {
      "name": "Київ",
      "code": "KYIV"
    }
    """
    # Перевіримо, чи немає станції з таким code
    existing = db.query(models.Station).filter(models.Station.code == station.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Station with this code already exists")

    db_station = models.Station(
        name=station.name,
        code=station.code,
    )
    db.add(db_station)
    db.commit()
    db.refresh(db_station)
    return db_station


@router.get("/", response_model=List[schemas.Station])
def list_stations(db: Session = Depends(get_db)):
    """
    Отримати список усіх станцій.
    """
    stations = db.query(models.Station).all()
    return stations


@router.get("/{station_id}", response_model=schemas.Station)
def get_station(station_id: int, db: Session = Depends(get_db)):
    """
    Отримати одну станцію по id.
    """
    station = db.query(models.Station).filter(models.Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    return station


@router.delete("/{station_id}")
def delete_station(station_id: int, db: Session = Depends(get_db)):
    """
    Видалити станцію по id.
    (Для демо, далі можна буде навіть не використовувати.)
    """
    station = db.query(models.Station).filter(models.Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    db.delete(station)
    db.commit()
    return {"detail": "Station deleted"}
