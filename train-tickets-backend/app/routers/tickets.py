from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app import schemas

router = APIRouter(
    prefix="/tickets",
    tags=["tickets"],
)


@router.post("/", response_model=schemas.Ticket)
def create_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db)):
    """
    Створити квиток.
    Перевіряємо:
      - чи існує рейс
      - чи не зайняте вже місце у цьому рейсі
    """
    trip = db.query(models.Trip).filter(models.Trip.id == ticket.trip_id).first()
    if not trip:
        raise HTTPException(status_code=400, detail="Trip does not exist")

    # Перевіряємо, чи місце вже не зайняте
    existing = (
        db.query(models.Ticket)
        .filter(
            models.Ticket.trip_id == ticket.trip_id,
            models.Ticket.seat_number == ticket.seat_number,
            models.Ticket.status == "paid",
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Seat already booked for this trip")

    db_ticket = models.Ticket(
        trip_id=ticket.trip_id,
        passenger_name=ticket.passenger_name,
        seat_number=ticket.seat_number,
        price=ticket.price,
        status="paid",
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


@router.get("/{ticket_id}", response_model=schemas.Ticket)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    """
    Отримати квиток по id.
    """
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket
