# 🇰🇪 Kenya Road Design Agent

## Overview

The Kenya Road Design Agent is an AI-powered Retrieval-Augmented Generation (RAG) assistant designed to help highway and road engineers quickly retrieve, understand, and summarize information from Kenyan road design manuals, specifications, and engineering documents.

Instead of manually searching through hundreds of pages of design manuals, the agent retrieves the most relevant sections and generates concise, context-aware responses using a Large Language Model (LLM).

---

## Objectives

* Assist highway engineers in locating relevant design information.
* Reduce the time spent searching through technical manuals.
* Provide accurate summaries grounded in official engineering documents.
* Serve as a foundation for an intelligent road engineering assistant for Kenya.

---

## Current Features

* Load engineering documents from:

  * PDF
  * DOCX
  * TXT
  * CSV
  * Excel
  * JSON
* Automatic document chunking.
* Embedding generation using Sentence Transformers.
* FAISS vector database for semantic search.
* Retrieval-Augmented Generation (RAG).
* Natural language question answering using Groq LLMs.

---

## Project Structure

```text
KENYA_ROAD_DESIGN_AGENT/
│
├── data/                # Engineering documents
├── faiss_store/         # Vector database
├── src/
│   ├── data_loader.py
│   ├── embedding.py
│   ├── vectorstore.py
│   ├── search.py
│   └── ...
│
├── notebooks/
├── pyproject.toml
├── uv.lock
└── README.md
```

---

## Technologies Used

* Python
* LangChain
* FAISS
* Sentence Transformers
* Groq API
* python-dotenv
* NumPy
* UV Package Manager

---

## Installation

Clone the repository and install the dependencies.

```bash
uv sync
```

---

## Running the Project

Run the main application:

```bash
python main.py
```

or experiment using the provided Jupyter notebooks.

---

## Example

```python
from src.search import RAGSearch

rag = RAGSearch()

response = rag.search_and_summarize(
    "What are the recommended highway gradients?"
)

print(response)
```

---

## Future Roadmap

* Support for KeNHA Design Manual.
* Support for Road Geometric Design Standards.
* Multiple vector database backends.
* Hybrid Search (Semantic + Keyword).
* Engineering calculations.
* Road alignment recommendations.
* Pavement design assistant.
* GIS integration.
* CAD/BIM interoperability.
* Multi-agent architecture.
* Voice interface.
* Web application deployment.

---

## Target Users

* Highway Engineers
* Civil Engineers
* Transportation Engineers
* Engineering Students
* Infrastructure Consultants
* Road Authorities (KeNHA, KeRRA, KURA)

---

## Status

🚧 Prototype under active development.
