"""
R6 — Multi-Objective Relief Coordination via NSGA-II

Problem:
  After a disaster, relief coordinators must allocate limited volunteers and
  resources (medical kits, boats, food, shelters) across multiple incident sites.
  This is inherently multi-objective — optimising for response time conflicts with
  maximising coverage and minimising resource cost. No single "best" solution
  exists; instead, a Pareto front of trade-off solutions must be surfaced so that
  human decision-makers can choose based on current priorities.

Objectives (minimise all after negation):
  f1 — Minimise total weighted response time   (lives saved ∝ speed)
  f2 — Minimise unmet demand                   (coverage: fraction of critical needs unmet)
  f3 — Minimise resource cost / utilisation    (efficiency: waste avoidance)

Constraints:
  - Volunteer assignment cannot exceed availability per team
  - Resource quantities cannot exceed depot stock
  - Each site must receive at least one team if it is CRITICAL
  - Travel time bounded by max deployment horizon (default 4 hours)

Algorithm: NSGA-II (Non-dominated Sorting Genetic Algorithm II)
  - Representation: integer chromosome — [site_0_teams, site_1_teams, ..., resource_allocs...]
  - Selection: binary tournament on Pareto rank + crowding distance
  - Crossover: uniform crossover with feasibility repair
  - Mutation: ±1 integer mutation with constraint check
  - Population: 50 individuals, 100 generations (fast enough for real-time use)

Baselines:
  B1 — Greedy: allocate to highest-severity site first until resources exhausted
  B2 — Proportional: allocate proportionally to site severity score
  Proposed — NSGA-II Pareto front: returns multiple non-dominated solutions

Output per solution:
  site_allocations  — teams + resources assigned to each site
  f1_response_time  — weighted average response time (minutes)
  f2_unmet_demand   — fraction of critical needs unmet [0, 1]
  f3_resource_cost  — total resource units consumed
  pareto_rank       — 1 = Pareto-optimal
  crowding_distance — diversity metric within the front

Research contribution:
  Human coordinators select from the Pareto front based on current policy
  (speed-first vs coverage-first vs efficiency-first). The system exposes
  ALL trade-offs transparently, not just one "recommended" answer.
"""

import math
import random
import logging
from typing import List, Optional, Dict, Tuple

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

SEVERITY_DEMAND = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1, "UNKNOWN": 2}
SEVERITY_TIME_WEIGHT = {"CRITICAL": 2.0, "HIGH": 1.5, "MEDIUM": 1.0, "LOW": 0.5, "UNKNOWN": 1.0}

# Resource types tracked
RESOURCE_TYPES = ["medical_kits", "boats", "food_packages", "shelters", "rescue_equipment"]

# Cost per resource unit (used for f3)
RESOURCE_COST = {
    "medical_kits":      1.0,
    "boats":             3.0,
    "food_packages":     0.5,
    "shelters":          2.0,
    "rescue_equipment":  2.5,
    "volunteer_teams":   1.5,
}

# Approximate travel speed (km/h) — road conditions during disaster
TRAVEL_SPEED_KMH = 40.0
MAX_DEPLOYMENT_HOURS = 6.0

# NSGA-II parameters
POP_SIZE = 50
N_GENERATIONS = 80
CROSSOVER_PROB = 0.85
MUTATION_PROB = 0.15
TOURNAMENT_SIZE = 2


# ─────────────────────────────────────────────────────────────────────────────
# Problem representation
# ─────────────────────────────────────────────────────────────────────────────

def build_problem(
    sites: List[dict],
    depot: dict,
    available_teams: int,
) -> dict:
    """
    Encode the relief coordination problem.

    sites: list of incident sites:
      {"id": str, "severity": str, "distance_km": float,
       "affected_persons": int, "resource_needs": {type: quantity}}

    depot: available resources:
      {"volunteer_teams": int, "medical_kits": int, ...}

    Returns a problem dict used by all solvers.
    """
    n_sites = len(sites)

    # Demand matrix: how many resource units each site needs
    demand = []
    for s in sites:
        needs = s.get("resource_needs", {})
        demand.append({r: needs.get(r, 0) for r in RESOURCE_TYPES})

    # Travel time per site (minutes)
    travel_times = [
        (s.get("distance_km", 5.0) / TRAVEL_SPEED_KMH) * 60.0
        for s in sites
    ]

    # Max teams that can feasibly reach each site within deployment window
    max_reachable = [
        1 if travel_times[i] <= MAX_DEPLOYMENT_HOURS * 60 else 0
        for i in range(n_sites)
    ]

    return {
        "n_sites": n_sites,
        "sites": sites,
        "demand": demand,
        "travel_times": travel_times,
        "max_reachable": max_reachable,
        "depot": depot,
        "available_teams": min(available_teams, depot.get("volunteer_teams", available_teams)),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Chromosome: integer vector [teams_site_0 ... teams_site_n, res_0 ... res_r]
# ─────────────────────────────────────────────────────────────────────────────

def random_chromosome(problem: dict, rng: random.Random) -> List[int]:
    """Generate a random feasible allocation chromosome."""
    n = problem["n_sites"]
    chrom = []

    # Team allocation: distribute available_teams across sites
    teams_left = problem["available_teams"]
    for i in range(n):
        if i == n - 1:
            chrom.append(teams_left)
        else:
            max_here = min(teams_left, 3)
            t = rng.randint(0, max_here)
            chrom.append(t)
            teams_left = max(0, teams_left - t)

    # Resource allocation per type
    for res in RESOURCE_TYPES:
        stock = problem["depot"].get(res, 0)
        remaining = stock
        for i in range(n):
            if i == n - 1:
                chrom.append(remaining)
            else:
                need = problem["demand"][i].get(res, 0)
                give = rng.randint(0, min(need, remaining))
                chrom.append(give)
                remaining = max(0, remaining - give)

    return chrom


def decode_chromosome(chrom: List[int], problem: dict) -> dict:
    """Extract site allocations from a chromosome."""
    n = problem["n_sites"]
    allocations = []

    for i in range(n):
        site = problem["sites"][i]
        alloc = {
            "site_id": site.get("id", f"site_{i}"),
            "severity": site.get("severity", "MEDIUM"),
            "distance_km": site.get("distance_km", 0),
            "volunteer_teams": chrom[i],
            "resources": {},
        }
        for j, res in enumerate(RESOURCE_TYPES):
            idx = n + j * n + i
            if idx < len(chrom):
                alloc["resources"][res] = chrom[idx]
        allocations.append(alloc)

    return {"site_allocations": allocations}


# ─────────────────────────────────────────────────────────────────────────────
# Objective functions
# ─────────────────────────────────────────────────────────────────────────────

def evaluate(chrom: List[int], problem: dict) -> Tuple[float, float, float]:
    """
    Compute (f1, f2, f3) — all to be minimised.

    f1 = weighted average response time (minutes), weighted by severity
    f2 = fraction of critical+high demand unmet (0 = perfect coverage)
    f3 = total resource cost normalised by depot capacity
    """
    n = problem["n_sites"]
    decoded = decode_chromosome(chrom, problem)
    allocs = decoded["site_allocations"]

    # f1 — weighted response time
    total_weight = 0.0
    weighted_time = 0.0
    for i, a in enumerate(allocs):
        sev = a["severity"]
        w = SEVERITY_TIME_WEIGHT.get(sev, 1.0)
        travel = problem["travel_times"][i]
        teams = a["volunteer_teams"]
        # No team assigned → very large penalty time
        eff_time = travel if teams > 0 else travel + 180.0
        weighted_time += w * eff_time
        total_weight += w
    f1 = weighted_time / max(total_weight, 1.0)

    # f2 — unmet demand (critical/high sites without team = heavy penalty)
    unmet = 0.0
    total_demand = 0.0
    for i, a in enumerate(allocs):
        sev = a["severity"]
        demand_units = SEVERITY_DEMAND.get(sev, 2)
        teams = a["volunteer_teams"]
        for res in RESOURCE_TYPES:
            needed = problem["demand"][i].get(res, 0)
            provided = a["resources"].get(res, 0)
            shortfall = max(0, needed - provided)
            unmet += shortfall * (2.0 if sev in ("CRITICAL", "HIGH") else 1.0)
            total_demand += needed * (2.0 if sev in ("CRITICAL", "HIGH") else 1.0)
        # Team penalty
        if teams == 0 and sev in ("CRITICAL", "HIGH"):
            unmet += demand_units * 3.0
            total_demand += demand_units * 3.0
    f2 = unmet / max(total_demand, 1.0)

    # f3 — resource cost / utilisation (normalised)
    total_cost = 0.0
    max_cost = 0.0
    for a in allocs:
        total_cost += a["volunteer_teams"] * RESOURCE_COST["volunteer_teams"]
        for res in RESOURCE_TYPES:
            total_cost += a["resources"].get(res, 0) * RESOURCE_COST.get(res, 1.0)
    for res in RESOURCE_TYPES:
        max_cost += problem["depot"].get(res, 0) * RESOURCE_COST.get(res, 1.0)
    max_cost += problem["available_teams"] * RESOURCE_COST["volunteer_teams"]
    f3 = total_cost / max(max_cost, 1.0)

    return (f1, f2, f3)


def feasibility_repair(chrom: List[int], problem: dict) -> List[int]:
    """Clip chromosome to satisfy capacity constraints."""
    n = problem["n_sites"]
    chrom = chrom[:]

    # Repair team totals
    team_total = sum(chrom[:n])
    avail = problem["available_teams"]
    if team_total > avail:
        # Scale down proportionally
        for i in range(n):
            chrom[i] = max(0, int(chrom[i] * avail / max(team_total, 1)))

    # Ensure CRITICAL sites get at least 1 team if available
    remaining = avail - sum(chrom[:n])
    for i, s in enumerate(problem["sites"]):
        if s.get("severity") == "CRITICAL" and chrom[i] == 0 and remaining > 0:
            chrom[i] = 1
            remaining -= 1

    # Repair resource totals
    for j, res in enumerate(RESOURCE_TYPES):
        stock = problem["depot"].get(res, 0)
        start = n + j * n
        end = start + n
        total = sum(chrom[start:end])
        if total > stock and total > 0:
            for i in range(n):
                chrom[start + i] = max(0, int(chrom[start + i] * stock / total))

    return chrom


# ─────────────────────────────────────────────────────────────────────────────
# NSGA-II
# ─────────────────────────────────────────────────────────────────────────────

def dominates(a: Tuple, b: Tuple) -> bool:
    """Return True if solution a Pareto-dominates solution b."""
    return all(ai <= bi for ai, bi in zip(a, b)) and any(ai < bi for ai, bi in zip(a, b))


def fast_nondominated_sort(population: List[Tuple]) -> List[List[int]]:
    """NSGA-II fast non-dominated sort. Returns list of fronts (each front = list of indices)."""
    n = len(population)
    dominated_by = [[] for _ in range(n)]
    domination_count = [0] * n
    fronts = [[]]

    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            if dominates(population[i], population[j]):
                dominated_by[i].append(j)
            elif dominates(population[j], population[i]):
                domination_count[i] += 1
        if domination_count[i] == 0:
            fronts[0].append(i)

    k = 0
    while fronts[k]:
        next_front = []
        for i in fronts[k]:
            for j in dominated_by[i]:
                domination_count[j] -= 1
                if domination_count[j] == 0:
                    next_front.append(j)
        k += 1
        fronts.append(next_front)

    return [f for f in fronts if f]


def crowding_distance(front: List[int], objectives: List[Tuple]) -> Dict[int, float]:
    """Compute crowding distance for a single front."""
    n = len(front)
    if n <= 2:
        return {i: 9999.0 for i in front}

    distances = {i: 0.0 for i in front}
    n_obj = len(objectives[0])

    for m in range(n_obj):
        sorted_front = sorted(front, key=lambda i: objectives[i][m])
        distances[sorted_front[0]] = 9999.0
        distances[sorted_front[-1]] = 9999.0

        obj_min = objectives[sorted_front[0]][m]
        obj_max = objectives[sorted_front[-1]][m]
        span = max(obj_max - obj_min, 1e-9)

        for k in range(1, n - 1):
            distances[sorted_front[k]] += (
                objectives[sorted_front[k + 1]][m] - objectives[sorted_front[k - 1]][m]
            ) / span

    return distances


def tournament_select(
    population: List[List[int]],
    ranks: List[int],
    crowding: Dict[int, float],
    rng: random.Random,
) -> List[int]:
    """Binary tournament selection on Pareto rank + crowding distance."""
    candidates = rng.sample(range(len(population)), min(TOURNAMENT_SIZE, len(population)))
    best = candidates[0]
    for c in candidates[1:]:
        if ranks[c] < ranks[best]:
            best = c
        elif ranks[c] == ranks[best] and crowding.get(c, 0) > crowding.get(best, 0):
            best = c
    return population[best][:]


def uniform_crossover(p1: List[int], p2: List[int], rng: random.Random) -> Tuple[List[int], List[int]]:
    """Uniform crossover."""
    c1, c2 = p1[:], p2[:]
    for i in range(len(p1)):
        if rng.random() < 0.5:
            c1[i], c2[i] = c2[i], c1[i]
    return c1, c2


def mutate(chrom: List[int], problem: dict, rng: random.Random) -> List[int]:
    """Random ±1 integer mutation."""
    chrom = chrom[:]
    for i in range(len(chrom)):
        if rng.random() < MUTATION_PROB:
            chrom[i] = max(0, chrom[i] + rng.choice([-1, 1]))
    return feasibility_repair(chrom, problem)


def nsga2(problem: dict, seed: int = 42) -> dict:
    """
    Run NSGA-II to find Pareto-optimal relief allocation plans.
    Returns the full Pareto front with objectives and decoded allocations.
    """
    rng = random.Random(seed)

    # Initialise population
    population = [
        feasibility_repair(random_chromosome(problem, rng), problem)
        for _ in range(POP_SIZE)
    ]
    objectives = [evaluate(c, problem) for c in population]

    for gen in range(N_GENERATIONS):
        # Non-dominated sort + crowding distance
        fronts = fast_nondominated_sort(objectives)
        ranks = [0] * POP_SIZE
        all_crowding: Dict[int, float] = {}
        for rank, front in enumerate(fronts):
            cd = crowding_distance(front, objectives)
            for idx in front:
                ranks[idx] = rank
                all_crowding[idx] = cd.get(idx, 0.0)

        # Generate offspring
        offspring = []
        while len(offspring) < POP_SIZE:
            p1 = tournament_select(population, ranks, all_crowding, rng)
            p2 = tournament_select(population, ranks, all_crowding, rng)
            if rng.random() < CROSSOVER_PROB:
                c1, c2 = uniform_crossover(p1, p2, rng)
            else:
                c1, c2 = p1[:], p2[:]
            offspring.append(feasibility_repair(mutate(c1, problem, rng), problem))
            if len(offspring) < POP_SIZE:
                offspring.append(feasibility_repair(mutate(c2, problem, rng), problem))

        # Combine and select next generation
        combined = population + offspring
        combined_obj = objectives + [evaluate(c, problem) for c in offspring]

        combined_fronts = fast_nondominated_sort(combined_obj)
        combined_ranks = [0] * len(combined)
        combined_crowding: Dict[int, float] = {}
        for rank, front in enumerate(combined_fronts):
            cd = crowding_distance(front, combined_obj)
            for idx in front:
                combined_ranks[idx] = rank
                combined_crowding[idx] = cd.get(idx, 0.0)

        # Select top POP_SIZE by rank, then crowding
        sorted_idx = sorted(
            range(len(combined)),
            key=lambda i: (combined_ranks[i], -combined_crowding.get(i, 0.0)),
        )
        selected = sorted_idx[:POP_SIZE]
        population = [combined[i] for i in selected]
        objectives = [combined_obj[i] for i in selected]

    # Extract Pareto front (rank 0)
    final_fronts = fast_nondominated_sort(objectives)
    pareto_indices = final_fronts[0] if final_fronts else list(range(min(5, POP_SIZE)))
    final_crowding = crowding_distance(pareto_indices, objectives)

    pareto_solutions = []
    for idx in pareto_indices:
        decoded = decode_chromosome(population[idx], problem)
        f1, f2, f3 = objectives[idx]
        pareto_solutions.append({
            **decoded,
            "f1_avg_response_time_min": round(f1, 2),
            "f2_unmet_demand_fraction": round(f2, 4),
            "f3_resource_utilisation": round(f3, 4),
            "pareto_rank": 1,
            "crowding_distance": round(final_crowding.get(idx, 0.0), 4),
            "profile": _label_solution_profile(f1, f2, f3),
        })

    # Sort by a balanced score for display: normalise each objective
    if len(pareto_solutions) > 1:
        f1_vals = [s["f1_avg_response_time_min"] for s in pareto_solutions]
        f2_vals = [s["f2_unmet_demand_fraction"] for s in pareto_solutions]
        f3_vals = [s["f3_resource_utilisation"] for s in pareto_solutions]
        f1_range = max(max(f1_vals) - min(f1_vals), 1e-9)
        f2_range = max(max(f2_vals) - min(f2_vals), 1e-9)
        f3_range = max(max(f3_vals) - min(f3_vals), 1e-9)
        for s in pareto_solutions:
            s["balanced_score"] = round(
                (s["f1_avg_response_time_min"] - min(f1_vals)) / f1_range * 0.4 +
                (s["f2_unmet_demand_fraction"] - min(f2_vals)) / f2_range * 0.4 +
                (s["f3_resource_utilisation"] - min(f3_vals)) / f3_range * 0.2,
                4,
            )
        pareto_solutions.sort(key=lambda s: s["balanced_score"])
    else:
        for s in pareto_solutions:
            s["balanced_score"] = 0.5

    return {
        "pareto_front": pareto_solutions,
        "n_pareto_solutions": len(pareto_solutions),
        "generations_run": N_GENERATIONS,
        "population_size": POP_SIZE,
    }


def _label_solution_profile(f1: float, f2: float, f3: float) -> str:
    """Label a Pareto solution by its dominant characteristic."""
    if f2 <= 0.05:
        return "MAX_COVERAGE"
    if f1 <= 30.0:
        return "FASTEST_RESPONSE"
    if f3 <= 0.50:
        return "MOST_EFFICIENT"
    return "BALANCED"


# ─────────────────────────────────────────────────────────────────────────────
# Baselines
# ─────────────────────────────────────────────────────────────────────────────

def baseline_greedy(problem: dict) -> dict:
    """B1: Greedy — allocate teams to highest-severity site first."""
    n = problem["n_sites"]
    order = sorted(range(n), key=lambda i: SEVERITY_DEMAND.get(
        problem["sites"][i].get("severity", "MEDIUM"), 2), reverse=True)

    teams_left = problem["available_teams"]
    chrom = [0] * len(random_chromosome(problem, random.Random(0)))

    for i in order:
        give = min(2, teams_left)
        chrom[i] = give
        teams_left = max(0, teams_left - give)

    # Proportional resource allocation
    for j, res in enumerate(RESOURCE_TYPES):
        stock = problem["depot"].get(res, 0)
        remaining = stock
        for i in order:
            needed = problem["demand"][i].get(res, 0)
            give = min(needed, remaining)
            chrom[n + j * n + i] = give
            remaining = max(0, remaining - give)

    chrom = feasibility_repair(chrom, problem)
    decoded = decode_chromosome(chrom, problem)
    f1, f2, f3 = evaluate(chrom, problem)
    return {
        **decoded,
        "f1_avg_response_time_min": round(f1, 2),
        "f2_unmet_demand_fraction": round(f2, 4),
        "f3_resource_utilisation": round(f3, 4),
        "strategy": "B1_Greedy",
    }


def baseline_proportional(problem: dict) -> dict:
    """B2: Proportional — allocate proportionally to site severity score."""
    n = problem["n_sites"]
    scores = [SEVERITY_DEMAND.get(problem["sites"][i].get("severity", "MEDIUM"), 2) for i in range(n)]
    total_score = max(sum(scores), 1)

    teams_total = problem["available_teams"]
    chrom = [0] * len(random_chromosome(problem, random.Random(0)))

    for i in range(n):
        chrom[i] = max(0, round(scores[i] / total_score * teams_total))

    for j, res in enumerate(RESOURCE_TYPES):
        stock = problem["depot"].get(res, 0)
        for i in range(n):
            chrom[n + j * n + i] = max(0, round(scores[i] / total_score * stock))

    chrom = feasibility_repair(chrom, problem)
    decoded = decode_chromosome(chrom, problem)
    f1, f2, f3 = evaluate(chrom, problem)
    return {
        **decoded,
        "f1_avg_response_time_min": round(f1, 2),
        "f2_unmet_demand_fraction": round(f2, 4),
        "f3_resource_utilisation": round(f3, 4),
        "strategy": "B2_Proportional",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────────────────────────────────────────

def coordinate_relief(
    sites: List[dict],
    depot: dict,
    available_teams: int,
    preferred_objective: str = "BALANCED",
    seed: int = 42,
) -> dict:
    """
    Run multi-objective relief coordination for a set of incident sites.

    sites: list of incident sites (id, severity, distance_km, affected_persons,
           resource_needs: {medical_kits, boats, food_packages, shelters, rescue_equipment})
    depot: available resources {volunteer_teams, medical_kits, ...}
    available_teams: number of volunteer teams deployable
    preferred_objective: "FASTEST_RESPONSE" | "MAX_COVERAGE" | "MOST_EFFICIENT" | "BALANCED"

    Returns:
      pareto_front        — all Pareto-optimal plans
      recommended_plan    — best plan matching preferred_objective
      baseline_comparison — greedy and proportional baselines
      narrative           — XAI decision explanation
    """
    problem = build_problem(sites, depot, available_teams)

    # Run NSGA-II
    nsga_result = nsga2(problem, seed=seed)
    pareto_front = nsga_result["pareto_front"]

    # Select recommended plan based on preferred objective
    recommended = None
    if preferred_objective == "FASTEST_RESPONSE":
        recommended = min(pareto_front, key=lambda s: s["f1_avg_response_time_min"])
    elif preferred_objective == "MAX_COVERAGE":
        recommended = min(pareto_front, key=lambda s: s["f2_unmet_demand_fraction"])
    elif preferred_objective == "MOST_EFFICIENT":
        recommended = min(pareto_front, key=lambda s: s["f3_resource_utilisation"])
    else:
        recommended = pareto_front[0]  # lowest balanced_score

    # Baselines
    b1 = baseline_greedy(problem)
    b2 = baseline_proportional(problem)

    # Narrative
    rec = recommended
    narrative_parts = [
        f"NSGA-II found {len(pareto_front)} Pareto-optimal plans across {nsga_result['generations_run']} generations.",
        f"Recommended plan ({preferred_objective}): avg response {rec['f1_avg_response_time_min']:.1f} min, "
        f"unmet demand {rec['f2_unmet_demand_fraction']:.0%}, "
        f"resource utilisation {rec['f3_resource_utilisation']:.0%}.",
    ]

    # Highlight improvements over baselines
    if rec["f1_avg_response_time_min"] < b1["f1_avg_response_time_min"]:
        delta = b1["f1_avg_response_time_min"] - rec["f1_avg_response_time_min"]
        narrative_parts.append(f"Proposed is {delta:.1f} min faster than greedy (B1).")
    if rec["f2_unmet_demand_fraction"] < b1["f2_unmet_demand_fraction"]:
        delta = (b1["f2_unmet_demand_fraction"] - rec["f2_unmet_demand_fraction"]) * 100
        narrative_parts.append(f"Proposed covers {delta:.1f}% more critical demand than greedy (B1).")

    critical_sites = [s for s in sites if s.get("severity") == "CRITICAL"]
    if critical_sites:
        covered = sum(
            1 for a in rec["site_allocations"]
            if a["severity"] == "CRITICAL" and a["volunteer_teams"] > 0
        )
        narrative_parts.append(
            f"CRITICAL sites covered: {covered}/{len(critical_sites)}."
        )

    narrative_parts.append(
        f"Pareto front exposes trade-offs: "
        f"fastest plan ({min(s['f1_avg_response_time_min'] for s in pareto_front):.1f} min) "
        f"vs best coverage ({min(s['f2_unmet_demand_fraction'] for s in pareto_front):.0%} unmet)."
    )

    return {
        "pareto_front": pareto_front,
        "recommended_plan": rec,
        "preferred_objective": preferred_objective,
        "baseline_comparison": {
            "B1_greedy": b1,
            "B2_proportional": b2,
            "proposed_NSGA2": rec,
        },
        "nsga2_metadata": {
            "generations": nsga_result["generations_run"],
            "population_size": nsga_result["population_size"],
            "n_pareto_solutions": nsga_result["n_pareto_solutions"],
        },
        "narrative": " ".join(narrative_parts),
        "n_sites": len(sites),
        "n_teams": available_teams,
    }
