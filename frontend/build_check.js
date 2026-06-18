const { execSync } = require('child_process');

try {
  console.log("Running npm run build...");
  const stdout = execSync('npm run build', { cwd: 'e:\\sports-tournament-system\\frontend', stdio: 'pipe' });
  console.log("BUILD SUCCESS:");
  console.log(stdout.toString());
} catch (error) {
  console.log("BUILD FAILED:");
  console.log(error.stdout ? error.stdout.toString() : '');
  console.log(error.stderr ? error.stderr.toString() : '');
  console.log(error.message);
}
