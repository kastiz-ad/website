# Workspace and Roles V1

## Shared model

Family, Groups, Business and Enterprise use one workspace, membership, entitlement and permission engine. Churches and meetups are group workspace types, not separate products. A coordinated mission is owned by one context and uses that context’s wallet.

## Roles and permissions

Supported roles cover Owner, Parent, Adult Member, Child Member, Dependent, Organizer, Admin, Member, Workspace Admin, Finance Admin, Manager, Employee, Travel Coordinator, Guest and Viewer. Permissions cover mission view/create/edit/approve/complete, wallet view/manage, invitations, role management, shared memory, analytics, workspace, future billing and audit access.

Defaults are least privilege. Guests and viewers can only view missions. Employees cannot approve or manage wallets. Finance administrators cannot edit shared missions by default. Only active members are considered. The production server must validate every operation and prevent role escalation and cross-workspace access.

## Family and group privacy

Private member data is not automatically visible to a whole workspace. Shared Mission Memory requires explicit consent and records who added each item. Members can view permitted items, pause contribution, and future authenticated flows must support edit, removal and leaving a workspace.

Safe shared preferences include restaurants, dietary and transportation preferences, accessibility needs, frequent locations, meeting habits, scheduling patterns and business travel policies. Passwords, payment credentials, passport/government-ID images, highly sensitive health records and private legal documents are rejected.

## Business and enterprise

Business supports departments, trip/client/event missions, shared itineraries, approvals, department budgets, reassignment and audit-ready history. Enterprise adds organization hierarchy, sub-wallet architecture, policy and retention metadata, regional configuration and SSO/SCIM/API-ready interfaces. Those integrations are not implemented.

## Account/workspace switcher contract

The switcher must always display the current context before mission creation. Switching changes the wallet, permissions, memory, members, approval rules and entitlements. It must never silently fall back to another context’s wallet.
