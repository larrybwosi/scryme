import { seedSanity } from "./seed";

seedSanity()
  .then(() => {
    console.log("Sanity seed script completed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Sanity seed script failed:", err);
    process.exit(1);
  });
