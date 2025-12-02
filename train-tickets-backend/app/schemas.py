from datetime import datetime
from pydantic import BaseModel
from typing import Optional


# ---------- STATIONS ----------

class StationBase(BaseModel):
    name: str
    code: str


class StationCreate(StationBase):
    pass


class Station(StationBase):
    id: int

    class Config:
        orm_mode = True


# ---------- TRAINS ----------

class TrainBase(BaseModel):
    number: str
    name: Optional[str] = None


class TrainCreate(TrainBase):
    pass


class Train(TrainBase):
    id: int

    class Config:
        orm_mode = True


# ---------- ROUTES ----------

class RouteBase(BaseModel):
    start_station_id: int
    end_station_id: int


class RouteCreate(RouteBase):
    pass


class Route(RouteBase):
    id: int

    class Config:
        orm_mode = True


# ---------- TRIPS ----------

class TripBase(BaseModel):
    route_id: int
    train_id: int
    departure_time: datetime
    arrival_time: datetime
    base_price: float


class TripCreate(TripBase):
    pass


class Trip(TripBase):
    id: int

    class Config:
        orm_mode = True


# ---------- TICKETS ----------

class TicketBase(BaseModel):
    trip_id: int
    passenger_name: str
    seat_number: str
    price: float


class TicketCreate(TicketBase):
    pass


class Ticket(TicketBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        orm_mode = True