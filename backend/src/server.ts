import dotenv from "dotenv";
import dns from "dns";
import path from "path";
dns.setDefaultResultOrder("ipv4first");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import app from "./app";
import { connectDB } from "./shared/config/db";
import { competencyService } from "./modules/competencies/services/competency.service";
import { startBlockchainWorker } from "./modules/blockchain/services/blockchain-worker.service";
import { validateDocumentEncryptionConfiguration } from "./shared/services/document-encryption.service";

const PORT = process.env.PORT || 5001;

const bootstrap = async (): Promise<void> => {
  try {
    validateDocumentEncryptionConfiguration();
    await connectDB();
    await competencyService.initializeCatalog();
    startBlockchainWorker();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

void bootstrap();
