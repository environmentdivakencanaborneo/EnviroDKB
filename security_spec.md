# Security Specification: DivaMonitor

## 1. Data Invariants
- A record (environmental, waste_incoming, waste_outgoing, nursery, reclamation) can only be created by an authenticated user.
- Every record has a `userId` property that must exactly match the authenticated user's ID (`request.auth.uid`).
- Once a record is created, its `userId` and `createdAt` are immutable and cannot be updated.
- Users can only read, write, update, or delete their own documents (multi-tenant isolation by `userId`).
- Record IDs must be valid strings.
- Quantity fields (e.g., pH, TSS, debit, jumlah, curahHujan, rencanaKemajuan) must be within valid technical ranges (e.g., pH between 0 and 14).

## 2. The "Dirty Dozen" Malicious Payloads
1. **Identity Spoofing on Create**: Attempting to set `userId` to a victim's UID.
2. **Owner Hijacking on Update**: Attempting to alter `userId` on update.
3. **Immutability Bypass**: Altering `createdAt` timestamp.
4. **Invalid pH Value**: Submitting pH = 15 or pH = -1.
5. **No Auth Access**: Unauthenticated write to `environmental`.
6. **No Auth Read**: Unauthenticated read of any report or data.
7. **Cross-Tenant Read**: User A trying to read User B's waste ledger records.
8. **Junk Document ID**: Injecting a 2MB special character string as a document ID.
9. **Invalid Nursery Conditions**: Submitting `kondisi` outside the enum `["Sehat", "Kurang Sehat", "Mati"]`.
10. **Abusing Quantities**: Negative waste quantities or empty names.
11. **Negative Reclamation Topsoil**: Setting `ketebalanTopsoil` to `< 0`.
12. **Bypassing Server Timestamps**: Using a remote client timestamp instead of `request.time`.

## 3. Test Cases (Mental / rules simulation)
All 12 items should trigger `PERMISSION_DENIED` thanks to:
- `isSignedIn()` check
- `resource.data.userId == request.auth.uid` or `incoming().userId == request.auth.uid`
- `incoming().createdAt == request.time` and `incoming().userId == existing().userId`
- Specific validation helpers `isValidEnvironmental`, `isValidWasteIncoming`, etc.
