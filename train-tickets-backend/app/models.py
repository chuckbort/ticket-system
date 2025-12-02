from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)

    # Один-to-багато: станція може бути початковою/кінцевою в багатьох маршрутах
    routes_from = relationship("Route", back_populates="start_station", foreign_keys="Route.start_station_id")
    routes_to = relationship("Route", back_populates="end_station", foreign_keys="Route.end_station_id")


class Train(Base):
    __tablename__ = "trains"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)

    trips = relationship("Trip", back_populates="train")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    start_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    end_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)

    # Напр., "Київ — Львів" можна сформувати на фронті з назв станцій
    # але за бажанням можна додати поле route_name

    start_station = relationship("Station", foreign_keys=[start_station_id], back_populates="routes_from")
    end_station = relationship("Station", foreign_keys=[end_station_id], back_populates="routes_to")

    trips = relationship("Trip", back_populates="route")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False)

    departure_time = Column(DateTime, nullable=False)
    arrival_time = Column(DateTime, nullable=False)
    base_price = Column(Float, nullable=False)

    route = relationship("Route", back_populates="trips")
    train = relationship("Train", back_populates="trips")
    tickets = relationship("Ticket", back_populates="trip")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)

    passenger_name = Column(String, nullable=False)
    seat_number = Column(String, nullable=False)
    price = Column(Float, nullable=False)

    # Статус: "paid", "cancelled", тощо (для простоти — просто строка)
    status = Column(String, default="paid", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    trip = relationship("Trip", back_populates="tickets")
