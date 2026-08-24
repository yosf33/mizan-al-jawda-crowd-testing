-- V3.1 staging: preserve an immutable audit event when a Community Manager confirms a payout transfer.
-- Existing payout requests retain their current pending, processed, or rejected lifecycle values.

alter type public.transaction_type add value if not exists 'payout_sent';
