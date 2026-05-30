
## 2025-05-22 - Optimizing Inventory Integrity Checks
**Learning:** In enterprise ERPs, diagnostic services (like integrity checks) often fall into N+1 traps because they are built to verify one item at a time but then looped over the entire database. Parallelizing queries with Promise.all and using the 'in' operator for batch IDs is the most effective win.
**Action:** Always look for loops calling 'verify' or 'get' functions that perform DB queries. Batch those IDs and fetch in bulk before the loop.
