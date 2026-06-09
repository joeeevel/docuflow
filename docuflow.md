DocuFlow System Architecture Documentation
DocuFlow is an automated Micro-SaaS application designed to convert raw video walkthrough links (e.g., Loom, uploaded MP4s) into highly structured, context-aware corporate and technical Markdown documentation. It leverages asynchronous processing queues, media analysis, and multimodal AI orchestration to deliver reliable, developer-ready assets.
1. System Topology Overview
Because processing video, extracting audio, and calling multimodal AI APIs are time-intensive operations, DocuFlow decouples the user-facing web server from the heavy-lifting resource tasks using an Asynchronous Event-Driven Architecture.
Architectural Components
Frontend Client (SPA): Built with React and Tailwind CSS. Communicates with the web server via REST APIs for configurations/actions, and listens to real-time job status changes via WebSockets.
Web API Server (Monolith/Gateway): Built with Node.js/TypeScript (Express). It handles authentication, tenancy, dashboard interactions, stripe subscription verification, and pushes intensive jobs directly into the Redis-backed queue.
Message Broker & Job Queue: Managed by Redis and BullMQ. Ensures that tasks are executed reliably, handles automatic retries on API timeouts, and prevents the web server from blocking or crashing.
Background Worker Fleet: Independent Node.js script runtimes that pull tasks from BullMQ, execute local system binaries (ffmpeg), download media, and communicate with external AI inference APIs.

2. Core Automation Pipeline Data Flow
The lifecycle of an input URL transitioning into verified, structured documentation passes through four distinct phases:
[Client Dashboard] ──(1. Post Link)──> [Web API Server]
                                              │
                                       (2. Enqueue Job)
                                              ▼
[External API] <──(5. AI Analysis)── [BullMQ Redis]
      │                                       │
(Return JSON)                          (3. Pull Task)
      │                                       ▼
      └──────────────────────────────> [Background Worker]
                                              │
                                      (4. Process Media)
                                              ▼
                                      [Local /tmp Storage]

Phase 1: Ingestion & Initialization
User submits a valid video URL (Loom, Drive, or direct S4 link) via the React dashboard.
The Web API validates the payload, generates a unique UUID job_id, updates the database status to PENDING, and places the payload into the video-processing BullMQ queue.
The server immediately returns a 202 Accepted response with the job_id, forcing the frontend client to display an active loading state.
Phase 2: Media Deconstruction
An available Background Worker picks up the job and moves the database status to PROCESSING.
The worker downloads the source video into a secure local storage directory (/tmp/{job_id}/).
The worker executes fluent-ffmpeg to strip the audio track out, converting it into a highly compressed .mp3 format.
Concurrently, a frame-sampling routine takes snapshot images (.jpg) at logical intervals or whenever a major screen transition is programmatically detected.

Phase 3: Cognitive Evaluation & Transcription
The .mp3 audio file is securely streamed to a high-speed transcription service (e.g., Whisper API) to return a structured JSON script mapped with matching timestamps.
The worker aggregates the structural text timeline along with the corresponding base64-encoded visual frame snapshots.
The consolidated payload is dispatched to the gemini-2.5-flash endpoint using strict schema enforcement.
Phase 4: Structural Generation & Delivery
The AI evaluates the raw inputs against the mandated schema, outputting deterministic JSON containing the Markdown segments.
The Background Worker reads the structured JSON data, verifies compliance, saves the clean copy to the primary database, cleans up local /tmp directories, and marks the job as COMPLETED.
A WebSocket event triggers a state update on the frontend, rendering the finalized text markdown interface to the user.
3. Database Schema Models
Below is the relational blueprint mapping the core entities required for multi-tenant subscription operations.
User Entity
Tracks client identities, authentication meta, and team affiliations.
JSON
{
  "_id": "ObjectId",
  "email": "String (Unique)",
  "passwordHash": "String",
  "currentWorkspaceId": "ObjectId",
  "createdAt": "Date"
}


Workspace / Tenant Entity
Allows multi-user assignment and maps organizational subscription boundaries.
JSON
{
  "_id": "ObjectId",
  "name": "String",
  "ownerId": "ObjectId",
  "stripeCustomerId": "String",
  "subscriptionStatus": "String (active | trialing | past_due | canceled)",
  "planTier": "String (free | growth | agency)"
}

Job / Document Entity
Maintains state machine definitions, raw assets referencing, and the final output.
JSON
{
  "_id": "ObjectId",
  "workspaceId": "ObjectId (Indexed)",
  "userId": "ObjectId",
  "sourceUrl": "String",
  "status": "String (pending | processing | completed | failed)",
  "errorLog": "String (Nullable)",
  "generatedDoc": {
    "title": "String",
    "summary": "String",
    "markdownPayload": "String",
    "assets": [
      {
        "timestamp": "String",
        "storageUrl": "String"
      }
    ]
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}


4. Guardrails & Technical Constraints
To maintain application security, cost control, and stable runtimes, the system enforces the following deterministic rules:
A. Strict Output Enforce Structure
The AI engine must utilize an immutable target JSON layout. This guarantees that your UI components will never break when rendering the returned data.
JSON
{
  "title": "Module or Feature Title Name",
  "summary": "High level description of the business process.",
  "prerequisites": ["Required environments, access permissions, or tools"],
  "steps": [
    {
      "stepNumber": 1,
      "actionTitle": "Actionable imperative sentence",
      "detailedExplanation": "Detailed paragraphs describing technical context.",
      "codeSnippet": "Optional terminal commands or code blocks",
      "associatedImageTimestamp": "01:23"
    }
  ]
}

B. Security & Clean-Up Protocols
Ephemerality: Background workers are explicitly banned from persisting full-length raw consumer source files. The local /tmp/{job_id} directory must be wiped completely using an asynchronous fs.rm call inside a finally {} block upon job completion or terminal failure.
Data Minimization: Only base64 screenshots matching critical transcript timestamps are passed over the network wire to AI inference APIs, protecting client computational data limits.
C. Rate-Limiting & Queue Security
Concurrency Limits: The BullMQ configuration restricts concurrent image/media processing loops per background instance to protect CPU cores from running out of memory during massive video compression routines.
Dead-Letter Queues: Jobs failing more than 3 consecutive times are pushed into a isolated failure queue for engineer monitoring without choking the system pipeline.
