-- migrations/008_add_transfer_reason.sql
-- This migration adds the transfer_reason column to the stock_updates table
-- to store the reason provided when requesting a stock transfer

ALTER TABLE stock_updates 
ADD COLUMN IF NOT EXISTS transfer_reason TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN stock_updates.transfer_reason IS 'Reason provided by the user when requesting a stock transfer';
