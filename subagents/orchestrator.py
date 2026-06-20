"""
Subagent Orchestrator - Main entry point for running all subagents

Usage:
    # Run all subagents in parallel
    python -m subagents.orchestrator --all
    
    # Run specific phases
    python -m subagents.orchestrator --phases 5,6,9
    
    # Run with crewai coordination
    python -m subagents.orchestrator --crew
"""

import argparse
import json
import sys
import os
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from subagents.phase5_financial import Phase5Agent
    from subagents.phase6_accounting import Phase6Agent
    from subagents.phase9_reporting import Phase9Agent
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure to run from project root with: .\venv311\Scripts\activate")
    sys.exit(1)


class SubagentOrchestrator:
    """Orchestrates multiple subagents for parallel execution"""
    
    def __init__(self):
        self.agents = {
            5: Phase5Agent,
            6: Phase6Agent,
            9: Phase9Agent
        }
        self.results = {}
        self.start_time = None
        self.end_time = None
    
    def run_single_agent(self, phase: int) -> Dict:
        """Run a single agent by phase number"""
        if phase not in self.agents:
            return {
                "phase": phase,
                "status": "error",
                "error": f"Phase {phase} not available"
            }
        
        print(f"\n{'='*60}")
        print(f"🚀 Starting Phase {phase} Subagent")
        print(f"{'='*60}\n")
        
        agent_class = self.agents[phase]
        agent = agent_class()
        
        try:
            result = agent.run()
            result["status"] = "success"
            return result
        except Exception as e:
            return {
                "phase": phase,
                "status": "error",
                "error": str(e)
            }
    
    def run_parallel(self, phases: List[int], max_workers: int = 3) -> Dict:
        """Run multiple agents in parallel"""
        self.start_time = datetime.now()
        
        print(f"\n{'='*70}")
        print(f"🎬 SUBAGENT ORCHESTRATOR - Parallel Execution")
        print(f"🎯 Phases: {', '.join(map(str, phases))}")
        print(f"⚡ Max Workers: {max_workers}")
        print(f"{'='*70}\n")
        
        results = {
            "start_time": str(self.start_time),
            "phases": {},
            "summary": {
                "total": 0,
                "completed": 0,
                "failed": 0
            }
        }
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tasks
            future_to_phase = {
                executor.submit(self.run_single_agent, phase): phase 
                for phase in phases
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_phase):
                phase = future_to_phase[future]
                try:
                    result = future.result()
                    results["phases"][f"phase_{phase}"] = result
                    results["summary"]["total"] += 1
                    
                    if result.get("status") == "success":
                        results["summary"]["completed"] += 1
                        print(f"\n✅ Phase {phase} completed successfully")
                    else:
                        results["summary"]["failed"] += 1
                        print(f"\n❌ Phase {phase} failed: {result.get('error')}")
                        
                except Exception as e:
                    results["phases"][f"phase_{phase}"] = {
                        "status": "error",
                        "error": str(e)
                    }
                    results["summary"]["failed"] += 1
                    print(f"\n❌ Phase {phase} exception: {e}")
        
        self.end_time = datetime.now()
        results["end_time"] = str(self.end_time)
        results["duration"] = str(self.end_time - self.start_time)
        
        # Save results
        self._save_results(results)
        
        return results
    
    def run_sequential(self, phases: List[int]) -> Dict:
        """Run agents sequentially (useful for debugging)"""
        self.start_time = datetime.now()
        
        print(f"\n{'='*70}")
        print(f"🎬 SUBAGENT ORCHESTRATOR - Sequential Execution")
        print(f"🎯 Phases: {', '.join(map(str, phases))}")
        print(f"{'='*70}\n")
        
        results = {
            "start_time": str(self.start_time),
            "phases": {},
            "summary": {
                "total": 0,
                "completed": 0,
                "failed": 0
            }
        }
        
        for phase in phases:
            result = self.run_single_agent(phase)
            results["phases"][f"phase_{phase}"] = result
            results["summary"]["total"] += 1
            
            if result.get("status") == "success":
                results["summary"]["completed"] += 1
            else:
                results["summary"]["failed"] += 1
        
        self.end_time = datetime.now()
        results["end_time"] = str(self.end_time)
        results["duration"] = str(self.end_time - self.start_time)
        
        # Save results
        self._save_results(results)
        
        return results
    
    def _save_results(self, results: Dict):
        """Save orchestrator results to file"""
        output_dir = os.path.join(
            os.path.dirname(__file__), 
            "..", 
            "subagent_results"
        )
        os.makedirs(output_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"orchestrator_{timestamp}.json"
        
        filepath = os.path.join(output_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"\n📁 Results saved to: {filepath}")
    
    def print_summary(self, results: Dict):
        """Print execution summary"""
        print("\n" + "="*70)
        print("📊 EXECUTION SUMMARY")
        print("="*70)
        print(f"⏱ Total Duration: {results['duration']}")
        print(f"📈 Total Phases: {results['summary']['total']}")
        print(f"✅ Completed: {results['summary']['completed']}")
        print(f"❌ Failed: {results['summary']['failed']}")
        print("="*70)
        
        for phase_key, result in results['phases'].items():
            status_icon = "✅" if result.get('status') == 'success' else "❌"
            tasks = result.get('completed', 0)
            total = result.get('total_tasks', 0)
            print(f"{status_icon} {phase_key}: {tasks}/{total} tasks")
        
        print("="*70)


def main():
    parser = argparse.ArgumentParser(
        description="AUTO_Renew Subagent Orchestrator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m subagents.orchestrator --all
  python -m subagents.orchestrator --phases 5,6,9
  python -m subagents.orchestrator --phases 5 --sequential
        """
    )
    
    parser.add_argument(
        '--all', 
        action='store_true',
        help='Run all available phases (5, 6, 9)'
    )
    
    parser.add_argument(
        '--phases', 
        type=str,
        help='Comma-separated list of phases to run (e.g., 5,6,9)'
    )
    
    parser.add_argument(
        '--sequential', 
        action='store_true',
        help='Run phases sequentially instead of in parallel'
    )
    
    parser.add_argument(
        '--workers', 
        type=int,
        default=3,
        help='Maximum number of parallel workers (default: 3)'
    )
    
    args = parser.parse_args()
    
    # Determine which phases to run
    if args.all:
        phases = [5, 6, 9]
    elif args.phases:
        phases = [int(p.strip()) for p in args.phases.split(',')]
    else:
        parser.print_help()
        print("\n❌ Error: Specify --all or --phases")
        sys.exit(1)
    
    # Validate phases
    available_phases = [5, 6, 9]
    invalid = [p for p in phases if p not in available_phases]
    if invalid:
        print(f"❌ Invalid phases: {invalid}. Available: {available_phases}")
        sys.exit(1)
    
    # Run orchestrator
    orchestrator = SubagentOrchestrator()
    
    if args.sequential:
        results = orchestrator.run_sequential(phases)
    else:
        results = orchestrator.run_parallel(phases, max_workers=args.workers)
    
    # Print summary
    orchestrator.print_summary(results)
    
    # Exit with appropriate code
    if results['summary']['failed'] > 0:
        sys.exit(1)
    else:
        print("\n🎉 All phases completed successfully!")
        sys.exit(0)


if __name__ == "__main__":
    main()
