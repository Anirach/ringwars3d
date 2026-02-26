#!/usr/bin/env python3
"""
RINGwars Aggressive Agent (Python)
Strategy: Prioritize attacking enemy nodes, especially weak ones.
"""
import sys
import os

def parse_step_file(step_num):
    """Read and parse the step file."""
    step_file = f"{step_num}.step"
    if not os.path.exists(step_file):
        return None

    with open(step_file, 'r') as f:
        lines = f.read().strip().split('\n')

    fernies = [int(x) for x in lines[0].split(',')]
    owners = lines[1].split(',')
    new_fernies = int(lines[2])
    max_fernies = int(lines[3])

    return {
        'fernies': fernies,
        'owners': owners,
        'new_fernies': new_fernies,
        'max_fernies': max_fernies,
        'ring_size': len(fernies)
    }

def get_adjacent(idx, ring_size):
    """Get adjacent node indices."""
    return [(idx - 1) % ring_size, (idx + 1) % ring_size]

def find_attack_targets(state):
    """Find enemy nodes adjacent to our territory, sorted by weakness."""
    targets = []
    ring_size = state['ring_size']

    for i, owner in enumerate(state['owners']):
        if owner == 'Y':  # Our node
            for adj in get_adjacent(i, ring_size):
                if state['owners'][adj] == 'N':  # Enemy adjacent
                    targets.append({
                        'node': adj,
                        'fernies': state['fernies'][adj],
                        'from': i
                    })

    # Remove duplicates and sort by weakest first
    seen = set()
    unique_targets = []
    for t in targets:
        if t['node'] not in seen:
            seen.add(t['node'])
            unique_targets.append(t)

    return sorted(unique_targets, key=lambda x: x['fernies'])

def find_frontline_nodes(state):
    """Find our nodes that border enemies."""
    frontline = []
    ring_size = state['ring_size']

    for i, owner in enumerate(state['owners']):
        if owner == 'Y':
            for adj in get_adjacent(i, ring_size):
                if state['owners'][adj] == 'N':
                    frontline.append({
                        'node': i,
                        'fernies': state['fernies'][i]
                    })
                    break

    return frontline

def decide_moves(state):
    """Aggressive strategy: Attack weak enemies, reinforce frontline."""
    moves = []
    remaining = state['new_fernies']

    if remaining <= 0:
        return moves

    # Priority 1: Attack weakest enemy if we can win
    targets = find_attack_targets(state)
    for target in targets:
        if remaining > target['fernies']:
            moves.append((target['node'], remaining))
            return moves

    # Priority 2: Build up on frontline for future attack
    frontline = find_frontline_nodes(state)
    if frontline:
        # Reinforce weakest frontline node
        weakest = min(frontline, key=lambda x: x['fernies'])
        moves.append((weakest['node'], remaining))
        return moves

    # Priority 3: Expand to neutral
    for i, owner in enumerate(state['owners']):
        if owner == 'Y':
            for adj in get_adjacent(i, state['ring_size']):
                if state['owners'][adj] == 'U':
                    moves.append((adj, remaining))
                    return moves

    # Fallback: Reinforce any owned node
    for i, owner in enumerate(state['owners']):
        if owner == 'Y':
            moves.append((i, remaining))
            return moves

    return moves

def write_move_file(agent_name, moves):
    """Write moves to the move file."""
    move_file = f"{agent_name}.move"
    with open(move_file, 'w') as f:
        for node, amount in moves:
            f.write(f"{node},{amount}\n")

def main():
    if len(sys.argv) < 3:
        print("Usage: python aggressive_agent.py <step_num> <agent_name>")
        sys.exit(1)

    step_num = sys.argv[1]
    agent_name = sys.argv[2]

    state = parse_step_file(step_num)
    if state is None:
        print(f"Could not read step file: {step_num}.step")
        sys.exit(1)

    moves = decide_moves(state)
    write_move_file(agent_name, moves)

    print(f"Aggressive Agent: Placed {sum(m[1] for m in moves)} fernies on {len(moves)} nodes")

if __name__ == "__main__":
    main()
