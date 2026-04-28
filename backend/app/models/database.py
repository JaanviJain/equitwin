import json
from typing import Dict, Any
from datetime import datetime

# Simple in-memory database for hackathon purposes
# In production, replace with PostgreSQL/Redis

class Database:
    def __init__(self):
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.credentials: Dict[str, Dict[str, Any]] = {}
    
    def create_task(self, task_id: str, data: Dict[str, Any]):
        self.tasks[task_id] = {
            **data,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    
    def get_task(self, task_id: str) -> Dict[str, Any]:
        return self.tasks.get(task_id)
    
    def update_task(self, task_id: str, data: Dict[str, Any]):
        if task_id in self.tasks:
            self.tasks[task_id].update(data)
            self.tasks[task_id]["updated_at"] = datetime.now().isoformat()
    
    def store_credential(self, credential_id: str, data: Dict[str, Any]):
        self.credentials[credential_id] = data
    
    def get_credential(self, credential_id: str) -> Dict[str, Any]:
        return self.credentials.get(credential_id)

db = Database()