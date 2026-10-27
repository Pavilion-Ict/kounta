-- =============================================================
-- Kounta — Role Enforcement Migration
-- Run this in the Supabase SQL Editor ONCE before deploying
-- the new app code.
-- =============================================================

-- 1. Helper function: returns the current user's role in an org
CREATE OR REPLACE FUNCTION get_my_role(org_id uuid)
RETURNS text AS $$
  SELECT role FROM memberships
  WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- 2. Owner-only UPDATE / DELETE policies
--    These sit on top of existing SELECT/INSERT policies.
--    Tables: publishing_ledger, digital_prints_ledger, digital_prints_cop,
--            company_expenses, company_income, inventory_record, publishing_catalogue

-- publishing_ledger
CREATE POLICY "owners_can_update_publishing_ledger" ON publishing_ledger
  FOR UPDATE USING (get_my_role(organization_id) = 'owner');
CREATE POLICY "owners_can_delete_publishing_ledger" ON publishing_ledger
  FOR DELETE USING (get_my_role(organization_id) = 'owner');

-- digital_prints_ledger
CREATE POLICY "owners_can_update_digital_prints_ledger" ON digital_prints_ledger
  FOR UPDATE USING (get_my_role(organization_id) = 'owner');
CREATE POLICY "owners_can_delete_digital_prints_ledger" ON digital_prints_ledger
  FOR DELETE USING (get_my_role(organization_id) = 'owner');

-- digital_prints_cop
CREATE POLICY "owners_can_update_digital_prints_cop" ON digital_prints_cop
  FOR UPDATE USING (get_my_role(organization_id) = 'owner');
CREATE POLICY "owners_can_delete_digital_prints_cop" ON digital_prints_cop
  FOR DELETE USING (get_my_role(organization_id) = 'owner');

-- company_expenses
CREATE POLICY "owners_can_update_company_expenses" ON company_expenses
  FOR UPDATE USING (get_my_role(organization_id) = 'owner');
CREATE POLICY "owners_can_delete_company_expenses" ON company_expenses
  FOR DELETE USING (get_my_role(organization_id) = 'owner');

-- company_income
CREATE POLICY "owners_can_update_company_income" ON company_income
  FOR UPDATE USING (get_my_role(organization_id) = 'owner');
CREATE POLICY "owners_can_delete_company_income" ON company_income
  FOR DELETE USING (get_my_role(organization_id) = 'owner');

-- inventory_record
CREATE POLICY "owners_can_update_inventory_record" ON inventory_record
  FOR UPDATE USING (get_my_role(organization_id) = 'owner');
CREATE POLICY "owners_can_delete_inventory_record" ON inventory_record
  FOR DELETE USING (get_my_role(organization_id) = 'owner');

-- publishing_catalogue
CREATE POLICY "owners_can_update_publishing_catalogue" ON publishing_catalogue
  FOR UPDATE USING (get_my_role(organization_id) = 'owner');
CREATE POLICY "owners_can_delete_publishing_catalogue" ON publishing_catalogue
  FOR DELETE USING (get_my_role(organization_id) = 'owner');


-- 3. invitations table (for team invite flow)
CREATE TABLE IF NOT EXISTS invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       text NOT NULL,
  role        text NOT NULL CHECK (role IN ('owner', 'staff')),
  token       uuid NOT NULL DEFAULT gen_random_uuid(),
  invited_by  uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
-- Owners can fully manage invitations for their org
CREATE POLICY "owners_manage_invitations" ON invitations
  FOR ALL USING (get_my_role(org_id) = 'owner');
-- Service role can always read/write (for accept-invite processing)
CREATE POLICY "service_role_all_invitations" ON invitations
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 4. logo_url column on organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url text;

-- Done!
