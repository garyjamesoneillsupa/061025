import { AuthService } from "../middleware/auth";
import { storage } from "../storage";

async function setupInitialAdmin() {
  try {
    console.log("Setting up initial admin user...");
    
    // Check if admin already exists
    const existingAdmin = await storage.getUserCredentials("admin");
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Create initial admin user
    const adminPassword = AuthService.generateSecurePassword(12);
    const hashedPassword = await AuthService.hashPassword(adminPassword);
    
    await storage.createUserCredentials({
      username: "admin",
      hashedPassword,
      role: "admin",
      driverId: null,
      isActive: true,
    });

    console.log("✅ Initial admin user created successfully!");
    console.log("Username: admin");
    console.log("Password:", adminPassword);
    console.log("⚠️  Please save this password and change it after first login");
    
  } catch (error) {
    console.error("❌ Failed to setup admin user:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupInitialAdmin().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { setupInitialAdmin };