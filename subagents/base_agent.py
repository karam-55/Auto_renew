"""
Base Agent Class for all subagents
"""

import os
import json
from abc import ABC, abstractmethod
from typing import Dict, List, Optional
from datetime import datetime

class BaseSubagent(ABC):
    """Base class for all project subagents"""
    
    def __init__(self, phase_name: str, priority: str = "high"):
        self.phase_name = phase_name
        self.priority = priority
        self.tasks_completed = []
        self.tasks_pending = []
        self.start_time = None
        self.end_time = None
        
    @abstractmethod
    def get_tasks(self) -> List[Dict]:
        """Return list of tasks for this phase"""
        pass
    
    @abstractmethod
    def execute_task(self, task: Dict) -> Dict:
        """Execute a single task and return result"""
        pass
    
    def execute_all(self) -> Dict:
        """Execute all tasks and return summary"""
        self.start_time = datetime.now()
        self.tasks_pending = self.get_tasks()
        
        results = {
            "phase": self.phase_name,
            "priority": self.priority,
            "total_tasks": len(self.tasks_pending),
            "completed": 0,
            "failed": 0,
            "tasks": []
        }
        
        for task in self.tasks_pending:
            try:
                result = self.execute_task(task)
                results["tasks"].append(result)
                results["completed"] += 1
                self.tasks_completed.append(result)
            except Exception as e:
                results["failed"] += 1
                results["tasks"].append({
                    "task_id": task.get("id"),
                    "status": "failed",
                    "error": str(e)
                })
        
        self.end_time = datetime.now()
        results["duration"] = str(self.end_time - self.start_time)
        
        # Save results
        self._save_results(results)
        
        return results
    
    def _save_results(self, results: Dict):
        """Save execution results to file"""
        output_dir = os.path.join(
            os.path.dirname(__file__), 
            "..", 
            "subagent_results"
        )
        os.makedirs(output_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{self.phase_name.lower().replace(' ', '_')}_{timestamp}.json"
        
        filepath = os.path.join(output_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Results saved to: {filepath}")
    
    def get_status(self) -> Dict:
        """Get current execution status"""
        return {
            "phase": self.phase_name,
            "priority": self.priority,
            "total_tasks": len(self.tasks_pending),
            "completed": len(self.tasks_completed),
            "pending": len(self.tasks_pending) - len(self.tasks_completed),
            "running": self.start_time is not None and self.end_time is None
        }
