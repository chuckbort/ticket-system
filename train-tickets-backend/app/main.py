from fastapi import FastAPI
from app.routers import stations, trains, routes, trips, tickets, analytics
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models
from app.routers import stations, trains, routes, trips, tickets



app = FastAPI(
    title="Train Tickets API",
    description="Backend для продажу залізничних квитків та аналітики продажів",
    version="0.1.0",
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Підключаємо роутери
app.include_router(stations.router)
app.include_router(trains.router)
app.include_router(routes.router)
app.include_router(trips.router)
app.include_router(tickets.router)
app.include_router(analytics.router)



@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def read_root():
    return {"message": "Train Tickets API is running"}
