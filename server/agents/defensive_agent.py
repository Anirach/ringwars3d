#!/usr/bin/env python3
"""
RINGwars Defensive Agent (Python)
Strategy: Build strong positions, only attack when overwhelming advantage.
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

def analyze_territory(state):
    """Analyze our territory for defensive priorities."""
    analysis = {
        'threatened': [],      # Our nodes adjacent to stronger enemies
        'strong': [],          # Our nodes with high fernies
        'weak': [],            # Our nodes with low fernies
        'border_enemies': [],  # Enemy nodes we could attack
        'neutral_targets': []  # Neutral nodes we can expand to
    }

    ring_size = state['ring_size']

    for i, owner in enumerate(state['owners']):
        if owner == 'Y':
            my_fernies = state['fernies'][i]
            is_threatened = False

            for adj in get_adjacent(i, ring_size):
                adj_owner = state['owners'][adj]
                adj_fernies = state['fernies'][adj]

                if adj_owner == 'N':
                    if adj_fernies >= my_fernies:
                        is_threatened = True
                    analysis['border_enemies'].append({
                        'node': adj,
                        'fernies': adj_fernies
                    })
                elif adj_owner == 'U':
                    analysis['neutral_targets'].append({'node': adj})

            node_info = {'node': i, 'fernies': my_fernies}
            if is_threatened:
                analysis['threatened'].append(node_info)
            elif my_fernies >= state['max_fernies'] * 0.7:
                analysis['strong'].append(node_info)
            else:
                analysis['weak'].append(node_info)

    return analysis

def decide_moves(state):
    """Defensive strategy: Reinforce weak spots, attack only when strong."""
    moves = []
    remaining = state['new_fernies']

    if remaining <= 0:
        return moves

    analysis = analyze_territory(state)

    # Priority 1: Reinforce threatened nodes
    if analysis['threatened']:
        most_threatened = min(analysis['threatened'], key=lambda x: x['fernies'])
        moves.append((most_threatened['node'], remaining))
        return moves

    # Priority 2: Attack very weak enemies (2x advantage)
    for enemy in analysis['border_enemies']:
        for i, owner in enumerate(state['owners']):
            if owner == 'Y':
                my_fernies = state['fernies'][i]
                total_force = my_fernies + remaining
                if total_force > enemy['fernies'] * 2:
                    # Overwhelming advantage - attack!
                    moves.append((enemy['node'], remaining))
                    return moves

    # Priority 3: Expand to safe neutral territory
    if analysis['neutral_targets']:
        moves.append((analysis['neutral_targets'][0]['node'], remaining))
        return moves

    # Priority 4: Build up weakest owned node
    if analysis['weak']:
        weakest = min(analysis['weak'], key=lambda x: x['fernies'])
        moves.append((weakest['node'], remaining))
        return moves

    # Fallback: Reinforce any node
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
        print("Usage: python defensive_agent.py <step_num> <agent_name>")
        sys.exit(1)

    step_num = sys.argv[1]
    agent_name = sys.argv[2]

    state = parse_step_file(step_num)
    if state is None:
        print(f"Could not read step file: {step_num}.step")
        sys.exit(1)

    moves = decide_moves(state)
    write_move_file(agent_name, moves)

    print(f"Defensive Agent: Placed {sum(m[1] for m in moves)} fernies on {len(moves)} nodes")

if __name__ == "__main__":
    main()
