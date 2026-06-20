#!/usr/bin/env python3
"""
Run Multiple Subagents in Parallel

Usage:
    .\venv311\Scripts\activate
    python run_parallel_subagents.py
"""

import sys
import os
import json
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add subagents to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'subagents'))

from phase5_financial import Phase5Agent
from phase6_accounting import Phase6Agent
from phase9_reporting import Phase9Agent


def run_agent(agent_class, name):
    """Run a single agent and return results"""
    print(f"\n{'='*60}")
    print(f"🚀 Starting {name}")
    print(f"{'='*60}")
    
    try:
        agent = agent_class()
        result = agent.run()
        print(f"\n✅ {name} completed successfully")
        return {
            "name": name,
            "status": "success",
            "result": result
        }
    except Exception as e:
        print(f"\n❌ {name} failed: {e}")
        return {
            "name": name,
            "status": "failed",
            "error": str(e)
        }


def main():
    print("=" * 70)
    print("🎬 AUTO_RENEW PARALLEL SUBAGENTS")
    print("=" * 70)
    
    agents = [
        (Phase5Agent, "Phase 5: Financial Statements"),
        (Phase6Agent, "Phase 6: Advanced Accounting"),
        (Phase9Agent, "Phase 9: Advanced Reporting")
    ]
    
    start_time = datetime.now()
    results = []
    
    # Run in parallel with 3 workers
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {
            executor.submit(run_agent, agent_class, name): name 
            for agent_class, name in agents
        }
        
        for future in as_completed(futures):
            result = future.result()
            results.append(result)
    
    end_time = datetime.now()
    duration = end_time - start_time
    
    # Print summary
    print("\n" + "=" * 70)
    print("📊 EXECUTION SUMMARY")
    print("=" * 70)
    print(f"⏱ Total Duration: {duration}")
    print(f"📈 Total Agents: {len(results)}")
    
    success_count = sum(1 for r in results if r['status'] == 'success')
    failed_count = sum(1 for r in results if r['status'] == 'failed')
    
    print(f"✅ Successful: {success_count}")
    print(f"❌ Failed: {failed_count}")
    print("=" * 70)
    
    for result in results:
        icon = "✅" if result['status'] == 'success' else "❌"
        print(f"{icon} {result['name']}")
    
    print("=" * 70)
    
    # Save summary
    summary = {
        "start_time": str(start_time),
        "end_time": str(end_time),
        "duration": str(duration),
        "total_agents": len(results),
        "successful": success_count,
        "failed": failed_count,
        "results": results
    }
    
    output_dir = os.path.join(os.path.dirname(__file__), 'subagent_results')
    os.makedirs(output_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"parallel_execution_{timestamp}.json"
    
    filepath = os.path.join(output_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    print(f"\n📁 Summary saved to: {filepath}")
    
    if failed_count == 0:
        print("\n🎉 All phases completed successfully!")
        return 0
    else:
        print(f"\n⚠️ {failed_count} phase(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
