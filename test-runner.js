/**
 * Test Runner - Runs both Backend and Frontend tests
 *
 * Usage:
 *   npm run test           # Run all tests
 *   npm run test:be       # Backend tests only
 *   npm run test:fe       # Frontend tests only
 *   npm run test:watch    # Watch mode for backend
 *   npm run test:coverage # Coverage report
 */

const { exec, execSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname);
const FE_DIR = path.resolve(__dirname, "school-management-frontend");

function runCommand(cmd, dir, callback) {
  console.log(`\n📦 Running: ${cmd}`);
  console.log(`   Directory: ${dir}`);

  exec(cmd, { cwd: dir, stdio: "inherit" }, (error, stdout, stderr) => {
    if (callback) callback(error, stdout, stderr);
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || "all";

switch (command) {
  case "be":
  case "backend":
    console.log("🧪 Running Backend Tests...\n");
    execSync("npm test", { cwd: ROOT, stdio: "inherit" });
    break;

  case "fe":
  case "frontend":
    console.log("🧪 Running Frontend Tests...\n");
    execSync("npm test", { cwd: FE_DIR, stdio: "inherit" });
    break;

  case "watch":
    console.log("🧪 Running Backend Tests (Watch Mode)...\n");
    execSync("npm run test:watch", { cwd: ROOT, stdio: "inherit" });
    break;

  case "coverage":
    console.log("🧪 Running Tests with Coverage...\n");
    execSync("npm run test:coverage", { cwd: ROOT, stdio: "inherit" });
    console.log("\n📊 Generating Frontend Coverage...");
    execSync("npm run test:coverage", { cwd: FE_DIR, stdio: "inherit" });
    break;

  case "unit":
    console.log("🧪 Running Unit Tests (Backend)...\n");
    execSync("npm run test:unit", { cwd: ROOT, stdio: "inherit" });
    break;

  case "integration":
    console.log("🧪 Running Integration Tests...\n");
    execSync("npm run test:integration", { cwd: ROOT, stdio: "inherit" });
    break;

  default:
    console.log("🧪 Running All Tests...\n");

    // Run backend tests
    console.log("\n========== BACKEND TESTS ==========");
    try {
      execSync("npm test", { cwd: ROOT, stdio: "inherit" });
      console.log("✅ Backend tests passed");
    } catch (e) {
      console.log("❌ Backend tests failed");
    }

    // Run frontend tests
    console.log("\n========== FRONTEND TESTS ==========");
    try {
      execSync("npm test", { cwd: FE_DIR, stdio: "inherit" });
      console.log("✅ Frontend tests passed");
    } catch (e) {
      console.log("❌ Frontend tests failed");
    }
}
