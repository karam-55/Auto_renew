# 🤖 AUTO_Renew Subagents System

AI-powered subagents for parallel task execution across all 9 enhancement phases.

## 📋 Overview

This system uses **CrewAI** and **AutoGen** frameworks to coordinate multiple AI agents that can work on different project phases simultaneously.

## 🎯 Available Agents

| Agent | Phase | Priority | Tasks |
|-------|-------|----------|-------|
| `Phase5Agent` | Financial Statements | High | 10 |
| `Phase6Agent` | Advanced Accounting | High | 10 |
| `Phase9Agent` | Advanced Reporting | High | 10 |

## 🚀 Quick Start

### 1. Activate Environment
```powershell
C:\Users\FIX 11\projects\AUTO_Renew\venv311\Scripts\activate
```

### 2. Run Single Agent
```powershell
# Phase 5: Financial Statements
python run_subagents.py --phase 5

# Phase 6: Advanced Accounting
python run_subagents.py --phase 6

# Phase 9: Advanced Reporting
python run_subagents.py --phase 9
```

### 3. Run All Agents (Sequential)
```powershell
python run_subagents.py --all
```

### 4. Run All Agents (Parallel)
```powershell
python run_parallel_subagents.py
```

### 5. Run Specific Phases
```powershell
python run_subagents.py --phases 5,6
```

## 📁 File Structure

```
subagents/
├── __init__.py              # Package initialization
├── base_agent.py            # Base class for all agents
├── phase5_financial.py      # Phase 5 implementation
├── phase6_accounting.py     # Phase 6 implementation
├── phase9_reporting.py      # Phase 9 implementation
├── orchestrator.py          # Advanced orchestrator with CrewAI
└── README.md                # This file

run_subagents.py             # Sequential runner
run_parallel_subagents.py    # Parallel runner
requirements_ai.txt          # Python dependencies
```

## ⚙️ Configuration

### Environment Variables
Create `.env` file in project root:
```env
OPENAI_API_KEY=your_openai_api_key
CREWAI_LOG_LEVEL=INFO
```

### Customizing Agents

Edit task lists in each phase file:
- `phase5_financial.py` → `get_tasks()` method
- `phase6_accounting.py` → `get_tasks()` method  
- `phase9_reporting.py` → `get_tasks()` method

## 📊 Output

Results are saved to:
```
subagent_results/
├── phase_5_financial_statements_YYYYMMDD_HHMMSS.json
├── phase_6_advanced_accounting_YYYYMMDD_HHMMSS.json
├── phase_9_advanced_reporting_YYYYMMDD_HHMMSS.json
└── parallel_execution_YYYYMMDD_HHMMSS.json
```

## 🔧 Troubleshooting

### Import Errors
If you get `ImportError: attempted relative import`:
- Use `run_subagents.py` instead of running files directly
- Or add parent directory to Python path

### Memory Issues
If system slows down:
- Use sequential mode: `python run_subagents.py --all`
- Close Docker and WSL if not needed
- Restart Windsurf IDE to free memory

### Python Version
Must use Python 3.11:
```powershell
C:\Users\FIX 11\projects\AUTO_Renew\venv311\Scripts\python --version
# Should show: Python 3.11.x
```

## 📝 Notes

- **No Email Features**: All agents respect the "no email" policy
- **Schema First**: All new variables added to Prisma schema
- **High Priority Phases**: 5, 6, 9 (accounting focus)
- **Medium Priority Phases**: 1, 2, 3, 7, 8 (can be added later)

## 🎓 Advanced Usage

### Using CrewAI Orchestrator
```python
from subagents.orchestrator import SubagentOrchestrator

orch = SubagentOrchestrator()
results = orch.run_parallel([5, 6, 9])
```

### Custom Task Execution
```python
from subagents.phase5_financial import Phase5Agent

agent = Phase5Agent()
tasks = agent.get_tasks()
for task in tasks:
    result = agent.execute_task(task)
    print(result)
```

## 📞 Support

For issues or questions, check:
1. `subagent_results/` for execution logs
2. Task dependencies in each phase file
3. Base agent implementation in `base_agent.py`

---

**Last Updated**: 2026-05-26  
**Python Version**: 3.11.9  
**Frameworks**: CrewAI 1.14.5, AutoGen 0.10.0, LangChain 1.3.2
