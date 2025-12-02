from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app import schemas

router = APIRouter(
    prefix="/trains",
    tags=["trains"],
)


@router.post("/", response_model=schemas.Train)
def create_train(train: schemas.TrainCreate, db: Session = Depends(get_db)):
    """
    Створити поїзд.
    Приклад:
    {
      "number": "091К",
      "name": "Київ — Львів"
    }
    """
    existing = db.query(models.Train).filter(models.Train.number == train.number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Train with this number already exists")

    db_train = models.Train(
        number=train.number,
        name=train.name,
    )
    db.add(db_train)
    db.commit()
    db.refresh(db_train)
    return db_train


@router.get("/", response_model=List[schemas.Train])
def list_trains(db: Session = Depends(get_db)):
    """
    Отримати список усіх поїздів.
    """
    trains = db.query(models.Train).all()
    return trains
