import { test, expect } from '@playwright/test';

// Helper for deterministic authentication
async function loginAs(page: any, username: string, password: string = 'Password@2026') {
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
  await page.fill('#username_or_email', username);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 12000 });
}

test.describe('PPMS Phase 6 End-to-End System Verification', () => {

  // -------------------------------------------------------------
  // WORKFLOW 1: HOD WORKFLOW
  // -------------------------------------------------------------
  test('HOD Workflow: Department overview, 25 projects, discussion access, analytics, and CSV export', async ({ page }) => {
    await loginAs(page, 'hod.cse@college.edu', 'HodPass@2026');

    // 1. Verify department-wide dashboard
    await expect(page.getByText('HOD Department Overview')).toBeVisible();
    await expect(page.getByText(/13 Sections.*Total Projects/i)).toBeVisible();

    // 2. Open Project PRJ-2026-001
    await page.goto('/projects/1');
    await expect(page.getByText('PRJ-2026-001').first()).toBeVisible();

    // 3. Access authorized Discussions tab
    await page.getByRole('button', { name: /Discussions/i }).click();
    await expect(page.getByText(/PRJ-2026-001 Technical Discussion/i)).toBeVisible();
    await expect(page.getByText(/Live sync active/i)).toBeVisible();

    // 4. Review Analytics
    await page.goto('/analytics');
    await expect(page.getByText(/Viewing live operational analytics/i)).toBeVisible();

    // 5. Verify CSV Export button is present on dashboard
    await page.goto('/dashboard');
    const exportBtn = page.getByRole('button', { name: /Export Dept CSV/i });
    await expect(exportBtn).toBeVisible();

    // 6. Direct API check that HOD cannot read unauthorized private conversations
    const dmDenied = await page.evaluate(async () => {
      const token = localStorage.getItem('ppms_token');
      const res = await fetch('/api/v1/conversations/999999/messages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.status;
    });
    expect([403, 404]).toContain(dmDenied);
  });

  // -------------------------------------------------------------
  // WORKFLOW 2: ADVISOR WORKFLOW
  // -------------------------------------------------------------
  test('Advisor Workflow: Section scoping, authorized discussion, and cross-section isolation', async ({ page }) => {
    await loginAs(page, 'advisor.2a@college.edu', 'AdvisorPass@2026');

    // 1. Verify assigned section and year
    await expect(page.getByText('Section Advisor Overview')).toBeVisible();
    await expect(page.getByText(/Y2-CSE-A/i).first()).toBeVisible();

    // 2. Navigate to Section Projects
    await page.goto('/projects');
    await expect(page.getByText('PRJ-2026-001').first()).toBeVisible();
    await expect(page.getByText('PRJ-2026-002').first()).toBeVisible();

    // 3. Project from Section 2B (PRJ-2026-003) must NOT be visible to Section 2A advisor
    await expect(page.getByText('PRJ-2026-003')).not.toBeVisible();

    // 4. Open assigned project 1 and access discussions
    await page.goto('/projects/1');
    await page.getByRole('button', { name: /Discussions/i }).click();
    await expect(page.getByText(/Technical Discussion/i)).toBeVisible();

    // 5. Verify cross-section denial: attempt to open Project 3 (Section 2B)
    await page.goto('/projects/3');
    await expect(page.getByText(/Unable to load project workspace/i)).toBeVisible();
  });

  // -------------------------------------------------------------
  // WORKFLOW 3: MENTOR WORKFLOW
  // -------------------------------------------------------------
  test('Mentor Workflow: Supervision visibility, discussion message sending, and unassigned project isolation', async ({ page }) => {
    await loginAs(page, 'mentor.sharma@college.edu', 'MentorPass@2026');

    // 1. Verify Mentor Workspace
    await expect(page.getByText('Faculty Mentor Supervision')).toBeVisible();

    // 2. Open supervised Project 1
    await page.goto('/projects/1');
    await expect(page.getByText('PRJ-2026-001').first()).toBeVisible();

    // 3. Access discussions tab
    await page.getByRole('button', { name: /Discussions/i }).click();

    // 4. Send a project discussion message
    const msgInput = page.getByPlaceholder(/Write a message to project collaborators/i);
    await expect(msgInput).toBeVisible();
    const uniqueMentorMsg = `Mentor Review Note [E2E ${Date.now()}]: Excellent milestone delivery verified.`;
    await msgInput.fill(uniqueMentorMsg);
    await page.getByRole('button', { name: /Send Message/i }).click();

    // 5. Verify new message is rendered in discussion stream
    await expect(page.getByText(uniqueMentorMsg)).toBeVisible({ timeout: 8000 });

    // 6. Verify unassigned project isolation: attempt to open unassigned project (Project 10)
    await page.goto('/projects/10');
    await expect(page.getByText(/Unable to load project workspace/i)).toBeVisible();
  });

  // -------------------------------------------------------------
  // WORKFLOW 4: STUDENT WORKFLOW
  // -------------------------------------------------------------
  test('Student Workflow: Team project access, messaging, completed project certificate, and cross-team denial', async ({ page }) => {
    // 1. Log in as Student Lead 1 (Project 1)
    await loginAs(page, 'student_lead_1', 'StudentPass@2026');
    await expect(page.getByText('Student Project Hub')).toBeVisible();

    // 2. Open authorized Project 1
    await page.goto('/projects/1');
    await expect(page.getByText('PRJ-2026-001').first()).toBeVisible();

    // 3. Send student discussion message
    await page.getByRole('button', { name: /Discussions/i }).click();
    const studentInput = page.getByPlaceholder(/Write a message to project collaborators/i);
    const uniqueStudentMsg = `Student Team Update [E2E ${Date.now()}]: Verification code committed.`;
    await studentInput.fill(uniqueStudentMsg);
    await page.getByRole('button', { name: /Send Message/i }).click();
    await expect(page.getByText(uniqueStudentMsg)).toBeVisible({ timeout: 8000 });

    // 4. Verify Cross-team Denial: Student 1 attempts to open Project 2 (different team)
    await page.goto('/projects/2');
    await expect(page.getByText(/Unable to load project workspace/i)).toBeVisible();

    // 5. Test Certificate Eligibility: Student Lead 6 is on completed Project 6
    await loginAs(page, 'student_lead_6', 'StudentPass@2026');
    await page.goto('/projects/6');
    await expect(page.getByText('PRJ-2026-006').first()).toBeVisible();

    // 6. Verify "Download Completion Certificate" button is visible and eligible on Project 6
    const certBtn = page.getByRole('button', { name: /Download Completion Certificate/i });
    await expect(certBtn).toBeVisible();
  });

  // -------------------------------------------------------------
  // WORKFLOW 5: NOTIFICATION & DEADLINE REMINDER WORKFLOW
  // -------------------------------------------------------------
  test('Notification Workflow: Bell icon, dropdown, reminder trigger scan, and deduplication', async ({ page }) => {
    await loginAs(page, 'hod.cse@college.edu', 'HodPass@2026');

    // 1. Locate notification bell button
    const bellBtn = page.getByRole('button', { name: 'Notifications' });
    await expect(bellBtn).toBeVisible();

    // 2. Open notifications dropdown
    await bellBtn.click();
    await expect(page.getByText('Notifications', { exact: true })).toBeVisible();

    // 3. Mark all read if unread notifications exist
    const markAllBtn = page.getByRole('button', { name: /Mark all read/i });
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
    }

    // 4. Trigger deadline reminder scan via API and verify deduplication
    const scanResult = await page.evaluate(async () => {
      const token = localStorage.getItem('ppms_token');
      const res1 = await fetch('/api/v1/reminders/scan', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data1 = await res1.json();

      // Scan again to verify deduplication
      const res2 = await fetch('/api/v1/reminders/scan', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data2 = await res2.json();

      return { scan1: data1, scan2: data2 };
    });

    expect(scanResult.scan1.status).toBe('success');
    expect(scanResult.scan2.status).toBe('success');
    // On second scan within 24h window, newly created should be 0 (deduplicated)
    expect(scanResult.scan2.notifications_created).toBe(0);
  });

  // -------------------------------------------------------------
  // WORKFLOW 6: REGRESSION WORKFLOW
  // -------------------------------------------------------------
  test('Regression Workflow: 13 sections, 25 projects, role switching, and tabs preservation', async ({ page }) => {
    // 1. Verify 13 sections and 25 projects integrity under HOD
    await loginAs(page, 'hod.cse@college.edu', 'HodPass@2026');
    const counts = await page.evaluate(async () => {
      const token = localStorage.getItem('ppms_token');
      const projRes = await fetch('/api/v1/projects?size=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const projData = await projRes.json();
      return { totalProjects: projData.total };
    });
    expect(counts.totalProjects).toBe(325);

    // 2. Confirm all project workspace tabs remain present on Project 1
    await page.goto('/projects/1');
    await expect(page.getByRole('button', { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Team Members/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Tasks/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Milestones/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Progress Reports/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Documents/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Discussions/i })).toBeVisible();

    // 3. Test Multi-Role Switching: adv_3a has ADVISOR and MENTOR roles
    await loginAs(page, 'advisor.3a@college.edu', 'AdvisorPass@2026');
    await expect(page.getByText(/Section Advisor Overview/i)).toBeVisible();

    // Switch to MENTOR role
    const switchBtn = page.getByRole('button', { name: /Switch Role:/i });
    await expect(switchBtn).toBeVisible();
    await switchBtn.click();
    await page.getByRole('button', { name: 'MENTOR' }).click();

    // Verify switched to Mentor view
    await expect(page.getByText(/Faculty Mentor Supervision/i)).toBeVisible();
  });

  // -------------------------------------------------------------
  // WORKFLOW 7: PHASE 7 HARDENING & ZERO-COST VERIFICATION
  // -------------------------------------------------------------
  test('Hardening Workflow: Change password modal, system status API, and browser refresh persistence', async ({ page }) => {
    await loginAs(page, 'hod.cse@college.edu', 'HodPass@2026');

    // 1. Verify Change Password button in header opens modal
    const keyBtn = page.getByRole('button', { name: 'Change Password' });
    await expect(keyBtn).toBeVisible();
    await keyBtn.click();
    await expect(page.getByText('Change Account Password')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Change Account Password')).not.toBeVisible();

    // 2. Verify System Status endpoint through authenticated session
    const statusData = await page.evaluate(async () => {
      const res = await fetch('/api/v1/system/status');
      return await res.json();
    });
    expect(statusData.status).toBe('operational');
    expect(statusData.zero_cost_policy.compliant).toBe(true);
    expect(statusData.database.sections_count).toBe(13);
    expect(statusData.database.projects_count).toBe(325);

    // 3. Test browser refresh persistence: active session and state persist
    await page.reload();
    await expect(page.getByText('HOD Department Overview')).toBeVisible();
  });
});
