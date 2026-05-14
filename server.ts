import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Configure Multer for PDF/Image uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

app.use(express.json());

// Mock Print Queue State
interface PrintJob {
  id: string;
  filename: string;
  pages: number;
  status: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED';
  progress: number;
  timestamp: string;
  inkEstimate?: string;
}

let printQueue: PrintJob[] = [];
let logs: string[] = [
  `[${new Date().toISOString()}] SYSTEM: PrintFlow LXC Service Started`,
  `[${new Date().toISOString()}] SYSTEM: CUPS simulation initialized`,
  `[${new Date().toISOString()}] SYSTEM: Network listener active on port 631 (proxied)`
];

const addLog = (msg: string) => {
  const log = `[${new Date().toISOString()}] ${msg}`;
  logs.push(log);
  if (logs.length > 50) logs.shift();
};

// API: List Print Jobs
app.get("/api/jobs", (req, res) => {
  res.json(printQueue);
});

// API: System Logs
app.get("/api/logs", (req, res) => {
  res.json(logs);
});

// API: Print File
app.post("/api/print", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filename = req.file.originalname;
  const jobId = Math.random().toString(36).substring(7);

  addLog(`UPLOAD: Received file '${filename}' for Job ID: ${jobId}`);

  // Base mock logic (AI removed)
  const pages = Math.floor(Math.random() * 5) + 1;
  const inkEstimate = ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)];
  
  addLog(`ANALYSIS: System determined ${pages} pages with ${inkEstimate} ink intensity.`);

  const newJob: PrintJob = {
    id: jobId,
    filename,
    pages,
    status: 'PENDING',
    progress: 0,
    timestamp: new Date().toISOString(),
    inkEstimate
  };

  printQueue.push(newJob);

  // Simulate Printing Progress
  const simulatePrinting = (id: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      const job = printQueue.find(j => j.id === id);
      if (!job) {
        clearInterval(interval);
        return;
      }

      if (progress === 0) {
        job.status = 'PRINTING';
        addLog(`STATUS: Job ${id} entering state 'PRINTING'`);
      }

      progress += 20;
      job.progress = progress;

      if (progress >= 100) {
        job.status = 'COMPLETED';
        job.progress = 100;
        addLog(`STATUS: Job ${id} completed successfully`);
        clearInterval(interval);
      }
    }, 1500);
  };

  simulatePrinting(jobId);

  res.json({ success: true, jobId, analysis: inkEstimate });
});

// API: Clear Finished Jobs
app.post("/api/jobs/clear", (req, res) => {
  printQueue = printQueue.filter(j => j.status === 'PENDING' || j.status === 'PRINTING');
  addLog("SYSTEM: Cleared completed jobs from history.");
  res.json({ success: true });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
