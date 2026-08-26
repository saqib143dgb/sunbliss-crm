# Customer detail navigation stability

The final `global_detail_navigation_stability_patch.js` is intentionally loaded last.

It protects every active-customer navigation element carrying `data-unit` and `data-sno`, including Units, Overview task/overdue/cash-flow rows and other compatible drill-downs. It canonicalizes the target against `state.dues`, closes search overlays, rebinds `mainEl`, repairs a missing CRM shell while preserving navigation state, and verifies that a valid detail state retains a rendered `.detail` view.

Cancelled-unit archive navigation is intentionally excluded because it has its own archive workflow.
