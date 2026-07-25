# KASTIZ ONE V20 — Real Problem Resolution Benchmark

V20 adds a benchmark suite that evaluates whether ONE solves real problems instead of merely answering them.

It does not modify the homepage and does not add another mission architecture.

## What is evaluated

Each scenario is scored on fifteen dimensions:

1. Outcome clarity
2. Correct mission understanding
3. Context reuse
4. Number of unnecessary questions
5. Solution completeness
6. Feasibility
7. Provider relevance
8. Evidence honesty
9. Action preparedness
10. Approval correctness
11. Security compliance
12. Recovery readiness
13. Completion criteria
14. User effort reduction
15. Absence of generic chatbot filler

## Automatic fail conditions

A scenario fails when ONE:

- only gives advice or information;
- produces a provider list without a solution path;
- asks for information already known;
- invents availability, prices, requirements, or rankings;
- requests raw card, bank, password, OTP, or provider credentials;
- performs an action without approval;
- has no fallback;
- has no completion definition;
- produces a blank or unrelated result;
- overwhelms the user with avoidable conversation.

## Scenario coverage

The benchmark includes 25 real-world cases across:

- urgent home repair
- academy selection
- child struggling at school
- same-day dental pain
- cancer-center navigation
- finding an open pharmacy
- immigration lawyer
- Korean company formation
- foreigner settlement
- job search
- employer hiring
- passport renewal
- driver’s-license administration
- family trip
- missed flight recovery
- hotel cancellation
- date planning
- moving home
- real-estate agent selection
- tax accountant
- interpreter
- elderly-parent care coordination
- pet emergency navigation
- vehicle repair
- event planning

## Honest current result

Current benchmark run against the V16–V19 system:

- Cases: 25
- Passed: 25
- Failed: 0
- Average score: 81%

Weakest mission areas:

- Unnecessary questions avoided: 2.8/5
- Provider relevance: 3/5
- Absence of generic chatbot filler: 3.3/5
- Outcome clarity: 4/5
- Correct mission understanding: 4/5
- Context reuse: 4/5
- Action preparedness: 4/5

Maturity distribution:

- informative_answer: 0
- recommendation: 8
- prepared_solution: 17
- executable_approved_mission: 0
- completed_mission: 0

## Honest weaknesses

The benchmark shows ONE is no longer a simple answer engine, but it is not uniformly at prepared-solution maturity yet.

But the current system is still weakest in:

- real provider relevance, because provider integrations are mock/fallback rather than live;
- context reuse, because many benchmark scenarios do not include rich calendar/profile/history data;
- several missions still score as recommendations rather than fully prepared solutions;
- executable/completed mission maturity, because approval, provider auth, and real execution remain disabled by design.

That is correct for the prototype. The benchmark should not mark missions complete until real provider evidence or user confirmation exists.

## How to run

```bash
node --test tests/real-problem-resolution-benchmark-v20.test.mjs
```

The benchmark code lives in:

`js/benchmark/real-problem-resolution-benchmark-v20.js`
