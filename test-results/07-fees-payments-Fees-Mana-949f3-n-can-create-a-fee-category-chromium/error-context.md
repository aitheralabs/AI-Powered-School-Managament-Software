# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-fees-payments.spec.ts >> Fees Management - Admin >> can create a fee category
- Location: e2e\tests\07-fees-payments.spec.ts:38:7

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator: locator('mat-dialog-container, [role="dialog"]').locator('button[mat-raised-button]').first()
Expected: enabled
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeEnabled" with timeout 5000ms
  - waiting for locator('mat-dialog-container, [role="dialog"]').locator('button[mat-raised-button]').first()

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e9]:
    - generic [ref=e10]:
      - img [ref=e12]: school
      - generic [ref=e13]:
        - heading "EduManage" [level=2] [ref=e14]
        - paragraph [ref=e15]: School Management System
    - generic [ref=e16]:
      - img [ref=e18]: account_circle
      - generic [ref=e20]:
        - heading "Test Admin" [level=3] [ref=e21]
        - paragraph [ref=e22]: Admin
    - navigation [ref=e23]:
      - navigation [ref=e24]:
        - generic [ref=e26] [cursor=pointer]:
          - img [ref=e27]: dashboard
          - generic [ref=e28]: Dashboard
        - generic [ref=e30]:
          - generic [ref=e31] [cursor=pointer]:
            - img [ref=e32]: school
            - generic [ref=e33]:
              - generic [ref=e34]: Student Management
              - img [ref=e36]: keyboard_arrow_down
          - generic:
            - generic [ref=e37] [cursor=pointer]:
              - img [ref=e38]: group
              - generic [ref=e39]: All Students
            - generic [ref=e40] [cursor=pointer]:
              - img [ref=e41]: person_add
              - generic [ref=e42]: Add Student
            - generic [ref=e43] [cursor=pointer]:
              - img [ref=e44]: assessment
              - generic [ref=e45]: Student Reports
        - generic [ref=e47]:
          - generic [ref=e48] [cursor=pointer]:
            - img [ref=e49]: person
            - generic [ref=e50]:
              - generic [ref=e51]: Teacher Management
              - img [ref=e53]: keyboard_arrow_down
          - generic:
            - generic [ref=e54] [cursor=pointer]:
              - img [ref=e55]: group
              - generic [ref=e56]: All Teachers
            - generic [ref=e57] [cursor=pointer]:
              - img [ref=e58]: person_add
              - generic [ref=e59]: Add Teacher
            - generic [ref=e60] [cursor=pointer]:
              - img [ref=e61]: assignment_ind
              - generic [ref=e62]: Teacher Assignments
        - generic [ref=e64]:
          - generic [ref=e65] [cursor=pointer]:
            - img [ref=e66]: account_tree
            - generic [ref=e67]:
              - generic [ref=e68]: Academic Structure
              - img [ref=e70]: keyboard_arrow_down
          - generic:
            - generic [ref=e71] [cursor=pointer]:
              - img [ref=e72]: class
              - generic [ref=e73]: Classes
            - generic [ref=e74] [cursor=pointer]:
              - img [ref=e75]: book
              - generic [ref=e76]: Subjects
            - generic [ref=e77] [cursor=pointer]:
              - img [ref=e78]: calendar_today
              - generic [ref=e79]: Academic Years
        - generic [ref=e81]:
          - generic [ref=e82] [cursor=pointer]:
            - img [ref=e83]: how_to_reg
            - generic [ref=e84]:
              - generic [ref=e85]: Attendance
              - img [ref=e87]: keyboard_arrow_down
          - generic:
            - generic [ref=e88] [cursor=pointer]:
              - img [ref=e89]: assessment
              - generic [ref=e90]: Attendance Reports
            - generic [ref=e91] [cursor=pointer]:
              - img [ref=e92]: analytics
              - generic [ref=e93]: Attendance Analytics
        - generic [ref=e95]:
          - generic [ref=e96] [cursor=pointer]:
            - img [ref=e97]: payment
            - generic [ref=e98]:
              - generic [ref=e99]: Fee Management
              - img [ref=e101]: keyboard_arrow_down
          - generic:
            - generic [ref=e102] [cursor=pointer]:
              - img [ref=e103]: category
              - generic [ref=e104]: Fee Categories
            - generic [ref=e105] [cursor=pointer]:
              - img [ref=e106]: receipt
              - generic [ref=e107]: Student Fees
            - generic [ref=e108] [cursor=pointer]:
              - img [ref=e109]: payment
              - generic [ref=e110]: Payments
            - generic [ref=e111] [cursor=pointer]:
              - img [ref=e112]: assessment
              - generic [ref=e113]: Fee Reports
        - generic [ref=e115]:
          - generic [ref=e116] [cursor=pointer]:
            - img [ref=e117]: grade
            - generic [ref=e118]:
              - generic [ref=e119]: Grades & Assessment
              - img [ref=e121]: keyboard_arrow_down
          - generic:
            - generic [ref=e122] [cursor=pointer]:
              - img [ref=e123]: description
              - generic [ref=e124]: Report Cards
            - generic [ref=e125] [cursor=pointer]:
              - img [ref=e126]: quiz
              - generic [ref=e127]: Assessment Types
        - generic [ref=e129]:
          - generic [ref=e130] [cursor=pointer]:
            - img [ref=e131]: calendar_view_week
            - generic [ref=e132]:
              - generic [ref=e133]: Timetable
              - img [ref=e135]: keyboard_arrow_down
          - generic:
            - generic [ref=e136] [cursor=pointer]:
              - img [ref=e137]: grid_view
              - generic [ref=e138]: Class Timetable
            - generic [ref=e139] [cursor=pointer]:
              - img [ref=e140]: edit_calendar
              - generic [ref=e141]: Manage Slots
            - generic [ref=e142] [cursor=pointer]:
              - img [ref=e143]: assignment
              - generic [ref=e144]: Exams
        - generic [ref=e146]:
          - generic [ref=e147] [cursor=pointer]:
            - img [ref=e148]: badge
            - generic [ref=e149]:
              - generic [ref=e150]: Staff Management
              - img [ref=e152]: keyboard_arrow_down
          - generic:
            - generic [ref=e153] [cursor=pointer]:
              - img [ref=e154]: group
              - generic [ref=e155]: All Staff
            - generic [ref=e156] [cursor=pointer]:
              - img [ref=e157]: person_add
              - generic [ref=e158]: Add Staff
        - generic [ref=e160]:
          - generic [ref=e161] [cursor=pointer]:
            - img [ref=e162]: family_restroom
            - generic [ref=e163]:
              - generic [ref=e164]: Parents
              - img [ref=e166]: keyboard_arrow_down
          - generic:
            - generic [ref=e167] [cursor=pointer]:
              - img [ref=e168]: group
              - generic [ref=e169]: All Parents
            - generic [ref=e170] [cursor=pointer]:
              - img [ref=e171]: person_add
              - generic [ref=e172]: Add Parent
        - generic [ref=e174]:
          - generic [ref=e175] [cursor=pointer]:
            - img [ref=e176]: analytics
            - generic [ref=e177]:
              - generic [ref=e178]: Reports & Analytics
              - img [ref=e180]: keyboard_arrow_down
          - generic:
            - generic [ref=e181] [cursor=pointer]:
              - img [ref=e182]: how_to_reg
              - generic [ref=e183]: Attendance Reports
            - generic [ref=e184] [cursor=pointer]:
              - img [ref=e185]: account_balance
              - generic [ref=e186]: Fee Reports
            - generic [ref=e187] [cursor=pointer]:
              - img [ref=e188]: description
              - generic [ref=e189]: Report Cards
        - generic [ref=e191] [cursor=pointer]:
          - img [ref=e192]: smart_toy
          - generic [ref=e193]: AI Assistant
        - generic [ref=e195] [cursor=pointer]:
          - img [ref=e196]: settings
          - generic [ref=e197]: Settings
    - generic [ref=e199]:
      - paragraph [ref=e200]: v2.0.0-beta
      - paragraph [ref=e201]: © 2025 EduManage SaaS
  - generic [ref=e203]:
    - banner [ref=e205]:
      - generic [ref=e206]:
        - button [ref=e207] [cursor=pointer]:
          - img [ref=e208]: menu
        - generic [ref=e209]:
          - img [ref=e210]: home
          - generic [ref=e211]: /
          - generic [ref=e212]: Fees
      - generic [ref=e213]:
        - generic [ref=e214]:
          - img [ref=e215]: search
          - textbox "Search anything…" [ref=e216]
          - generic [ref=e217]: ⌘K
        - button [ref=e219] [cursor=pointer]:
          - img [ref=e220]: notifications_outlined
        - button "TA Test Admin Admin" [ref=e222] [cursor=pointer]:
          - generic [ref=e224]: TA
          - generic [ref=e225]:
            - generic [ref=e226]: Test Admin
            - generic [ref=e227]: Admin
          - img [ref=e228]: expand_more
    - generic [ref=e231]:
      - generic [ref=e232]:
        - generic [ref=e233]:
          - heading "Fee Management" [level=1] [ref=e234]
          - paragraph [ref=e235]: Manage fee categories, assignments, and payments
        - generic [ref=e236]:
          - button "Refresh" [ref=e237]:
            - img [ref=e238]: refresh
            - generic [ref=e239]: Refresh
          - button "Assign Fee" [ref=e242]:
            - img [ref=e243]: assignment
            - generic [ref=e244]: Assign Fee
          - button "New Category" [active] [ref=e247]:
            - img [ref=e248]: add
            - generic [ref=e249]: New Category
      - generic [ref=e252]:
        - generic [ref=e253]:
          - img [ref=e255]: check_circle
          - generic [ref=e256]:
            - paragraph [ref=e257]: ₹0
            - paragraph [ref=e258]: Collected
            - paragraph [ref=e259]: 0% rate
        - generic [ref=e260]:
          - img [ref=e262]: schedule
          - generic [ref=e263]:
            - paragraph [ref=e264]: ₹0
            - paragraph [ref=e265]: Pending
            - paragraph [ref=e266]: 0 dues
        - generic [ref=e267]:
          - img [ref=e269]: warning
          - generic [ref=e270]:
            - paragraph [ref=e271]: ₹0
            - paragraph [ref=e272]: Overdue
            - paragraph [ref=e273]: 0 defaulters
        - generic [ref=e274]:
          - img [ref=e276]: receipt_long
          - generic [ref=e277]:
            - paragraph [ref=e278]: ₹0
            - paragraph [ref=e279]: Total Billed
            - paragraph [ref=e280]: 0 records
      - generic [ref=e281]:
        - generic [ref=e282]:
          - heading "Fee Categories" [level=2] [ref=e283]
          - button [ref=e284] [cursor=pointer]:
            - img [ref=e285]: add_circle
        - table
      - generic [ref=e288]:
        - generic [ref=e289]:
          - heading "Student Fees" [level=2] [ref=e290]
          - generic [ref=e294] [cursor=pointer]:
            - generic [ref=e295]: Status
            - combobox "Status" [ref=e297]:
              - generic [ref=e298]:
                - generic [ref=e300]: All
                - img [ref=e303]
        - table [ref=e305]:
          - rowgroup [ref=e306]:
            - row "Student Category Amount Paid Due Date Status" [ref=e307]:
              - columnheader "Student" [ref=e308]
              - columnheader "Category" [ref=e309]
              - columnheader "Amount" [ref=e310]
              - columnheader "Paid" [ref=e311]
              - columnheader "Due Date" [ref=e312]
              - columnheader "Status" [ref=e313]
              - columnheader [ref=e314]
          - rowgroup
        - paragraph [ref=e315]: No fee records found for the selected filter.
        - group [ref=e316]:
          - generic [ref=e318]:
            - generic [ref=e319]:
              - generic [ref=e320]: "Items per page:"
              - combobox "Items per page:" [ref=e325] [cursor=pointer]:
                - generic [ref=e326]:
                  - generic [ref=e328]: "20"
                  - img [ref=e331]
            - generic [ref=e334]:
              - generic [ref=e335]: 0 of 0
              - button "Previous page" [disabled] [ref=e336]:
                - img [ref=e337]
              - button "Next page" [disabled] [ref=e341]:
                - img [ref=e342]
```

# Test source

```ts
  1   | /**
  2   |  * 07 — Fees & Payments Management
  3   |  * Tests: fee categories, fee assignment, payment recording, student fee view
  4   |  */
  5   | import { test, expect } from '@playwright/test';
  6   | import { STATE } from '../fixtures/constants';
  7   | 
  8   | test.describe('Fees Management - Admin', () => {
  9   |   test.use({ storageState: STATE.admin });
  10  | 
  11  |   test('fees categories page loads', async ({ page }) => {
  12  |     await page.goto('/fees/categories');
  13  |     await page.waitForLoadState('networkidle');
  14  |     await expect(page.locator('h1, h2, .page-title, mat-card').first()).toBeVisible();
  15  |   });
  16  | 
  17  |   test('fee categories are displayed', async ({ page }) => {
  18  |     await page.goto('/fees/categories');
  19  |     await page.waitForLoadState('networkidle');
  20  |     await page.waitForTimeout(2000);
  21  |     await expect(page.locator('body')).not.toContainText('Unexpected error');
  22  |   });
  23  | 
  24  |   test('fee category form opens', async ({ page }) => {
  25  |     await page.goto('/fees/categories');
  26  |     await page.waitForLoadState('networkidle');
  27  |     await page.waitForTimeout(1000);
  28  | 
  29  |     const addBtn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
  30  |     if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  31  |       await addBtn.click();
  32  |       await expect(
  33  |         page.locator('mat-dialog-container, [role="dialog"]').first()
  34  |       ).toBeVisible({ timeout: 5000 });
  35  |     }
  36  |   });
  37  | 
  38  |   test('can create a fee category', async ({ page }) => {
  39  |     await page.goto('/fees/categories');
  40  |     await page.waitForLoadState('networkidle');
  41  |     await page.waitForTimeout(1000);
  42  | 
  43  |     const addBtn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
  44  |     if (!(await addBtn.isVisible({ timeout: 3000 }).catch(() => false))) return;
  45  | 
  46  |     await addBtn.click();
  47  |     await page.waitForTimeout(500);
  48  | 
  49  |     const ts = Date.now();
  50  |     const dialog = page.locator('mat-dialog-container, [role="dialog"]');
  51  |     await expect(dialog.first()).toBeVisible({ timeout: 5000 });
  52  | 
  53  |     // Fill required fields
  54  |     await dialog.locator('input[formControlName="name"]').first().fill(`Tuition${ts}`);
  55  |     await page.keyboard.press('Tab');
  56  |     await dialog.locator('input[formControlName="amount"]').first().fill('5000');
  57  |     await page.keyboard.press('Tab');
  58  | 
  59  |     // Explicitly select the frequency mat-select so that ControlValueAccessor.onChange()
  60  |     // is triggered. A programmatic default ('monthly') in the FormGroup sets the form
  61  |     // control value but mat-select's internal state can be out of sync until the user
  62  |     // interacts with it, which can leave Validators.required unsatisfied at submit time.
  63  |     const freqSelect = dialog.locator('mat-select[formControlName="frequency"]');
  64  |     if (await freqSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
  65  |       await freqSelect.click();
  66  |       const monthlyOpt = page.locator('mat-option').filter({ hasText: /monthly/i }).first();
  67  |       if (await monthlyOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
  68  |         await monthlyOpt.click();
  69  |       } else {
  70  |         // Close the panel if the option didn't appear to avoid leaving an open overlay
  71  |         await page.keyboard.press('Escape');
  72  |       }
  73  |       await page.waitForTimeout(300);
  74  |     }
  75  | 
  76  |     // Confirm form is valid before clicking
  77  |     const submitBtn = dialog.locator('button[mat-raised-button]').first();
> 78  |     await expect(submitBtn).toBeEnabled({ timeout: 5000 });
      |                             ^ Error: expect(locator).toBeEnabled() failed
  79  | 
  80  |     // Use page.route to intercept the POST before it hits the network.
  81  |     // This avoids the race between waitForRequest listener registration and the
  82  |     // request dispatch, and sidesteps any CORS preflight issues caused by the
  83  |     // Authorization header that the auth interceptor adds to every request.
  84  |     // The route handler fires if and only if Angular actually calls HttpClient.post()
  85  |     // — that IS the proof of submission. Fulfilling with a success response causes
  86  |     // the component to close the dialog, which we then assert below.
  87  |     let postRequestMade = false;
  88  |     await page.route('**/fees/categories', async route => {
  89  |       if (route.request().method() === 'POST') {
  90  |         postRequestMade = true;
  91  |         await route.fulfill({
  92  |           status: 201,
  93  |           contentType: 'application/json',
  94  |           body: JSON.stringify({
  95  |             success: true,
  96  |             data: {
  97  |               id: `test-${ts}`,
  98  |               name: `Tuition${ts}`,
  99  |               amount: 5000,
  100 |               frequency: 'monthly',
  101 |               isMandatory: true,
  102 |               description: '',
  103 |             },
  104 |           }),
  105 |         });
  106 |       } else {
  107 |         await route.continue();
  108 |       }
  109 |     });
  110 | 
  111 |     await submitBtn.click();
  112 | 
  113 |     // The dialog closes only after the API call succeeds — confirming form submission.
  114 |     await expect(dialog.first()).not.toBeVisible({ timeout: 10000 });
  115 |     expect(postRequestMade).toBe(true);
  116 | 
  117 |     await page.unroute('**/fees/categories');
  118 |   });
  119 | 
  120 |   test('payments list page loads', async ({ page }) => {
  121 |     await page.goto('/fees/payments');
  122 |     await page.waitForLoadState('networkidle');
  123 |     await page.waitForTimeout(2000);
  124 |     await expect(page.locator('body')).not.toContainText('Unexpected error');
  125 |   });
  126 | 
  127 |   test('can record a payment', async ({ page }) => {
  128 |     await page.goto('/fees/payments');
  129 |     await page.waitForLoadState('networkidle');
  130 |     await page.waitForTimeout(1000);
  131 | 
  132 |     const addBtn = page.locator('button').filter({ hasText: /record|add payment|new/i }).first();
  133 |     if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  134 |       await addBtn.click();
  135 |       await expect(
  136 |         page.locator('mat-dialog-container, [role="dialog"]').first()
  137 |       ).toBeVisible({ timeout: 5000 });
  138 |     }
  139 |   });
  140 | 
  141 |   test('student fee assignment page loads', async ({ page }) => {
  142 |     await page.goto('/fees/assign');
  143 |     await page.waitForLoadState('networkidle');
  144 |     await page.waitForTimeout(2000);
  145 |     await expect(page.locator('body')).not.toContainText('Unexpected error');
  146 |   });
  147 | 
  148 |   test('fee report page loads', async ({ page }) => {
  149 |     await page.goto('/fees');
  150 |     await page.waitForLoadState('networkidle');
  151 |     const reportLink = page.locator('a, button').filter({ hasText: /report|summary/i }).first();
  152 |     if (await reportLink.isVisible({ timeout: 3000 }).catch(() => false)) {
  153 |       await reportLink.click();
  154 |       await page.waitForLoadState('networkidle');
  155 |       await expect(page.locator('body')).not.toContainText('Unexpected error');
  156 |     }
  157 |   });
  158 | });
  159 | 
  160 | test.describe('Fees - Student View', () => {
  161 |   test.use({ storageState: STATE.student });
  162 | 
  163 |   test('student can view their fee details', async ({ page }) => {
  164 |     await page.goto('/fees');
  165 |     await page.waitForLoadState('networkidle');
  166 |     await page.waitForTimeout(2000);
  167 |     await expect(page.locator('body')).not.toContainText('Unexpected error');
  168 |   });
  169 | });
  170 | 
  171 | test.describe('Fees - Parent View', () => {
  172 |   test.use({ storageState: STATE.parent });
  173 | 
  174 |   test('parent can view fee details', async ({ page }) => {
  175 |     await page.goto('/fees');
  176 |     await page.waitForLoadState('networkidle');
  177 |     await page.waitForTimeout(2000);
  178 |     await expect(page.locator('body')).not.toContainText('Unexpected error');
```