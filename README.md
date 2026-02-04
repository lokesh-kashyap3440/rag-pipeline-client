# RAG Pipeline Client (React)

A modern, mobile-responsive chat interface for interacting with your RAG Pipeline. Built with React, Vite, and Tailwind CSS.

## Features

-   **📱 Mobile First:** Fully responsive UI with a drawer-based sidebar and dynamic viewport handling for Android/iOS.
-   **💬 Real-time Chat:** Interactive chat interface with source citations.
-   **file Upload:** Drag-and-drop or tap-to-upload support for PDFs.
-   **🎛️ OCR Toggle:** Option to enable Vision-based processing for scanned documents.

## Prerequisites

-   Node.js v18+
-   Running instance of the [rag-pipeline-node](https://github.com/your-username/rag-pipeline-node) backend.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/rag-pipeline-client.git
    cd rag-pipeline-client
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Development

1.  **Configure API URL:**
    Create a `.env` file (or rename `.env.example`):
    ```env
    VITE_API_URL=http://localhost:3000/api
    ```

2.  **Start the dev server:**
    ```bash
    npm run dev
    ```

## Building for Production

```bash
npm run build
```
The output will be in the `dist` folder.

## Deployment (Render)

This project is configured for **Render Static Sites**.

1.  Create a **Static Site** on Render.
2.  Connect this repository.
3.  **Build Command:** `npm install && npm run build`
4.  **Publish Directory:** `dist`
5.  **Environment Variables:**
    -   `VITE_API_URL`: The full URL of your deployed backend (e.g., `https://my-rag-api.onrender.com/api`).