#!/usr/bin/env python3
"""
Run Subagents Script

Usage:
    .\venv311\Scripts\activate
    python run_subagents.py --phase 5
    python run_subagents.py --all
    python run_subagents.py --phases 5,6,9
"""

import sys
import os
import argparse

# Add subagents to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'subagents'))

from phase5_financial import Phase5Agent
from phase6_accounting import Phase6Agent
from phase9_reporting import Phase9Agent


def main():
    parser = argparse.ArgumentParser(description='Run AUTO_Renew Subagents')
    parser.add_argument('--phase', type=int, help='Run single phase (5, 6, or 9)')
    parser.add_argument('--all', action='store_true', help='Run all phases')
    parser.add_argument('--phases', type=str, help='Comma-separated phases (e.g., 5,6,9)')
    
    args = parser.parse_args()
    
    agents = {
        5: Phase5Agent,
        6: Phase6Agent,
        9: Phase9Agent
    }
    
    phases_to_run = []
    
    if args.all:
        phases_to_run = [5, 6, 9]
    elif args.phase:
        phases_to_run = [args.phase]
    elif args.phases:
        phases_to_run = [int(p.strip()) for p in args.phases.split(',')]
    else:
        parser.print_help()
        return
    
    print("=" * 70)
    print("🚀 AUTO_RENEW SUBAGENTS")
    print("=" * 70)
    print(f"Running phases: {phases_to_run}")
    print("=" * 70)
    
    for phase in phases_to_run:
        if phase in agents:
            print(f"\n{'='*70}")
            print(f"🎯 Phase {phase}")
            print(f"{'='*70}")
            agent = agents[phase]()
            try:
                agent.run()
            except Exception as e:
                print(f"❌ Error in phase {phase}: {e}")
        else:
            print(f"❌ Phase {phase} not available")
    
    print("\n" + "=" * 70)
    print("✅ All phases complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()
