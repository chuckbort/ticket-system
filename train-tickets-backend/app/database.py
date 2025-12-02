from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Шлях до нашої SQLite-бази (файл буде створений у корені проєкту)
SQLALCHEMY_DATABASE_URL = "sqlite:///./train_tickets.db"

# Для SQLite треба додати цей параметр
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# Фабрика сесій для роботи з БД
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовий клас для всіх моделей
Base = declarative_base()


# Dependency для FastAPI — будемо використовувати в ендпоінтах
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
