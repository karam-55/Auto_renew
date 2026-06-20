"""
Subagents System for AUTO_Renew Project

This module provides AI-powered subagents for parallel task execution
across all 9 enhancement phases.

Usage:
    from subagents import Phase5Agent, Phase6Agent, Phase9Agent
    
    agent = Phase5Agent()
    agent.execute_tasks()
"""

from .phase5_financial import Phase5Agent
from .phase6_accounting import Phase6Agent
from .phase9_reporting import Phase9Agent

__all__ = ['Phase5Agent', 'Phase6Agent', 'Phase9Agent']
__version__ = '1.0.0'
