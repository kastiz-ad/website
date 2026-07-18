# ONE Experience Engine V3

## Architecture

V3 turns a mission into a shared `ExperienceContext`, selects an `ExperiencePack`, scores three `ExperienceOption` records, exposes exactly one primary `ONEPick`, and produces an approval-gated `ExperienceReceipt`. Korea Weekend, Global Escapes, Business Travel, Events, and Healthcare all use the same engine. The implementation is in `js/engine/experience-engine-v3.js`; the interactive reference surface is `trusted-demo.html`.

Core records are: `ExperienceContext`, `ExperiencePack`, `ExperienceOption`, `ExperienceStep`, `TransportPlan`, `WeatherBackup`, `ONEValue`, `ApprovalSummary`, `ExperienceReceipt`, and `ProviderDataState`.

## Context logic

The engine recognizes user group, purpose, time, budget, start, transportation, children, mobility, diet, weather, language, return deadline, preferences, and consented memory. It asks at most three questions and only when start, time, or budget could materially change the plan. Relationship and medical details are not persisted implicitly.

## ONE Pick and decision modes

Every decision has exactly one primary `⭐ ONE Pick` plus two alternatives. Reasons are limited to three compact factual statements. The default is Best Overall. Save Money, Save Time, Relax, Active, Premium, Family Friendly, Romantic, Accessible, Local Experience, and Business Efficient rerank the same shared options without forcing an extra question.

## Demo-data rules

Each record carries source type, timestamp, provider, location, price, availability, rating status, cancellation status, transport estimate, and confidence. V3 labels sample availability and estimated travel time. Missing ratings remain `null`/Not available. No event, price, availability, traffic, review, or savings figure is presented as live unless a future connector verifies it.

## Healthcare safety

Healthcare ONE Pick means logistical fit only. It is never a diagnosis, doctor-quality ranking, or treatment choice. The page presents a medical disclaimer. Urgent-language detection shows emergency guidance before the plan. Symptoms, diagnoses, results, prescriptions, documents, and treatment histories are not stored by V3.

## Memory and approval

V3 reuses the existing consent-based Mission Memory sanitizer. Without consent nothing is stored. Sensitive medical, identity, passport, payment, contact, and child information is excluded. Before any action the approval summary lists reservations, estimated cost, information sharing, handoffs, risks, and deadlines. In this sprint those arrays remain empty and the only action is `Prepare Demo Mission`.

## Provider integration points

Future connectors should normalize records into `ProviderDataState`, attach evidence and timestamps, refresh immediately before approval, and pass through approval protection. The engine must not call a provider directly. Live payment, booking, provider contact, passport storage, and medical-record storage remain disabled.

## Accessibility

The reference page uses semantic headings, lists and timelines, native selects/details, visible focus, keyboard-operable controls, Escape-close dialogs, status-independent labels, mobile tap targets, and reduced-motion support inherited from the shared stylesheet.

