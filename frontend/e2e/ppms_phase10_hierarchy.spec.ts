import { test, expect } from '@playwright/test';

async function loginAs(page: any, username: string, password: string = 'Password@2026') {
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
  await page.fill('#username_or_email', username);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 12000 });
}

test.describe('PPMS Phase 10 — Academic Hierarchy & Zero-Cost E2E Verification', () => {

  test('3-Level Academic Hierarchy Navigation (Department -> Year -> Section -> Projects)', async ({ page }) => {
    // 1. Log in as HOD
    await loginAs(page, 'hod.cse@college.edu', 'HodPass@2026');

    // Level 1: Department Overview
    await expect(page.getByText('HOD Department Overview')).toBeVisible();
    await expect(page.getByText(/325 Total Projects/i)).toBeVisible();
    await expect(page.getByText('All 13 Sections')).toBeVisible();

    // Verify 3 Academic Year cards exist
    await expect(page.getByText('Second Year').first()).toBeVisible();
    await expect(page.getByText('Third Year').first()).toBeVisible();
    await expect(page.getByText('Fourth Year').first()).toBeVisible();

    // Verify NO bar charts or pie charts are rendered anywhere
    const rechartsSurface = page.locator('.recharts-surface');
    await expect(rechartsSurface).toHaveCount(0);
    const canvasElements = page.locator('canvas');
    await expect(canvasElements).toHaveCount(0);

    // 2. Drill down to Level 2: Second Year Dashboard
    const y2ExploreBtn = page.getByRole('button', { name: /Explore Second Year Dashboard/i });
    await expect(y2ExploreBtn).toBeVisible();
    await y2ExploreBtn.click();

    // Verify Level 2: Second Year Dashboard
    await expect(page.getByText(/Second Year Academic Dashboard/i)).toBeVisible();
    await expect(page.getByText('Section CSE-A')).toBeVisible();
    await expect(page.getByText('Section CSE-B')).toBeVisible();
    await expect(page.getByText('Section CSE-C')).toBeVisible();
    await expect(page.getByText('Section CSE-D')).toBeVisible();
    await expect(page.getByText('Section CSE-E')).toBeVisible();

    // 3. Drill down to Level 3: Section CSE-A
    const secAExploreBtn = page.getByRole('button', { name: /View Section Projects/i }).first();
    await expect(secAExploreBtn).toBeVisible();
    await secAExploreBtn.click();

    // Verify Level 3: Section Project List
    await expect(page.getByText(/Projects in Section CSE-A/i)).toBeVisible();
    await expect(page.getByText('PRJ-2026-001')).toBeVisible();
    await expect(page.getByText('PRJ-2026-002')).toBeVisible();

    // 4. Navigation: Back to Second Year
    await page.getByRole('button', { name: /Back to Second Year/i }).click();
    await expect(page.getByText(/Second Year Academic Dashboard/i)).toBeVisible();

    // 5. Navigation: Back to Department Overview
    await page.getByRole('button', { name: /Back to Department/i }).click();
    await expect(page.getByText('HOD Department Overview')).toBeVisible();
  });

  test('Section Advisor Scoped Hierarchy and Project Portfolio', async ({ page }) => {
    // Log in as Advisor for Second Year CSE-A
    await loginAs(page, 'advisor.2a@college.edu', 'AdvisorPass@2026');

    await expect(page.getByText('Section Advisor Overview')).toBeVisible();
    await expect(page.getByText(/Section Y2-CSE-A/i).first()).toBeVisible();
    await expect(page.getByText('25 Projects', { exact: true })).toBeVisible();

    // Verify Project Portfolio table contains Section 2A projects
    await expect(page.getByText('PRJ-2026-001').first()).toBeVisible();
    await expect(page.getByText('PRJ-2026-002').first()).toBeVisible();

    // Verify NO bar charts or pie charts
    await expect(page.locator('.recharts-surface')).toHaveCount(0);
  });

  test('Faculty Mentor Supervised Projects Grouped by Cohort', async ({ page }) => {
    // Log in as Faculty Mentor
    await loginAs(page, 'mentor.sharma@college.edu', 'MentorPass@2026');

    await expect(page.getByText('Faculty Mentor Supervision')).toBeVisible();
    await expect(page.getByText(/All Cohorts/i)).toBeVisible();

    // Verify supervised projects
    await expect(page.getByText('PRJ-2026-001').first()).toBeVisible();

    // Verify NO bar charts or pie charts
    await expect(page.locator('.recharts-surface')).toHaveCount(0);
  });

  test('Student Hub Displays Academic Hierarchy and Team Members', async ({ page }) => {
    // Log in as Student Lead 1
    await loginAs(page, 'student_lead_1', 'StudentPass@2026');

    await expect(page.getByText('Student Project Hub')).toBeVisible();
    await expect(page.getByText(/Department of CSE/i)).toBeVisible();
    await expect(page.getByText('PRJ-2026-001').first()).toBeVisible();

    // Verify Team Members listed
    await expect(page.getByText(/Team Members:/i)).toBeVisible();

    // Verify NO bar charts or pie charts
    await expect(page.locator('.recharts-surface')).toHaveCount(0);
  });

  test('Projects List Page Year and Section Filter Coordination', async ({ page }) => {
    await loginAs(page, 'hod.cse@college.edu', 'HodPass@2026');

    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /Academic Projects/i })).toBeVisible();

    // Filter by Academic Year: Second Year
    const yearSelect = page.locator('select').nth(1); // second select is Academic Year
    await yearSelect.selectOption({ index: 1 }); // select first academic year option (Second Year)

    // Verify Section dropdown now shows Second Year sections
    const sectionSelect = page.locator('select').nth(2);
    await expect(sectionSelect).toBeVisible();
  });
});
