AI Agents Platform — Architecture & Runtime Flow

Project: THE_9-5_ESC_WORKSHOP
Status: Architecture as of August 26, 2026

1. Purpose

The application is a FastAPI-based AI Agents Platform. Agents use an LLM through the application's gateway and can access capabilities exposed through MCP servers. Knowledge retrieval is provided through a shared MCP server and currently combines the application's permanent/global knowledge with optional request-scoped uploaded knowledge.

The architecture is being designed so that temporary uploaded knowledge can later accommodate PageIndex without replacing the existing RAG pipeline.

2. High-Level Request Flow

A typical chat request currently follows this conceptual path:

Client
  |
  v
ChatService
  |
  +-- optional uploaded file
  |       |
  |       v
  |   scoped knowledge creation
  |
  v
AgentService
  |
  v
AgentRouter
  |
  v
BaseAgent
  |
  +-- KnowledgeContext
  |
  +-- agent_context (ContextVar)
  |
  v
LangGraph Agent
  |
  v
MCP tools
  |
  +--> search_knowledge
  |
  +--> search_web
  |
  v
Shared MCP
  |
  +--> Global RAG
  |
  +--> Scoped RAG (when a scope_id exists)
  |
  v
LLM
  |
  v
Response

3. Agent Context

app/agent/context.py defines:

agent_context: ContextVar[dict | None]

This stores information already known by the application during one agent invocation.

BaseAgent.invoke() sets the context immediately before graph.ainvoke() and resets it afterward.

This is important because the LLM should not be required to invent or provide values that the application already knows.

Examples include:

conversation_id

knowledge_scope_id

other caller-known identifiers

4. KnowledgeContext

app/knowledge/context.py contains:

@dataclass(frozen=True)
class KnowledgeContext:
    scope_id: str
    uploaded_document_id: str | None = None

The purpose is to describe the knowledge available to one agent execution.

The intended model is:

Global knowledge
     +
Optional temporary scoped knowledge

scope_id identifies the temporary knowledge scope.

uploaded_document_id identifies the document associated with that scope.

The dataclass is frozen so that a knowledge context cannot accidentally be mutated after it has been created.

5. Global Knowledge

The application already has a permanent RAG pipeline.

Conceptually:

Permanent documents
      |
      v
Document loading / ingestion
      |
      v
Chunking
      |
      v
Embedding / indexing
      |
      v
FAISS + vectorless/BM25 retrieval
      |
      v
Global knowledge

The permanent FAISS store is distinct from temporary uploaded-document knowledge.

Global knowledge should persist across requests and should not be deleted when a chat request finishes.

6. Scoped Knowledge

Scoped knowledge represents temporary knowledge associated with a scope ID.

The intended lifecycle is:

Upload file
    |
    v
Create scope
    |
    v
Store document
    |
    v
Load / parse document
    |
    v
Chunk
    |
    v
Build scoped index
    |
    v
Register scope metadata
    |
    v
KnowledgeContext(scope_id=...)
    |
    v
Agent execution
    |
    v
Scoped retrieval

A scope isolates temporary knowledge from the permanent global knowledge base.

7. Document Storage vs Scoped Knowledge

These are different responsibilities.

DocumentStorage

app/knowledge/storage.py is a lower-level storage abstraction.

It knows how to:

create a document directory;

write the document;

return a KnowledgeDocument;

delete a stored document.

It should not decide how the document is indexed or retrieved.

ScopedKnowledgeService

The planned application-facing service is responsible for the complete scoped-knowledge lifecycle:

scope creation
    |
    +-- document storage
    +-- document ingestion
    +-- indexing
    +-- scope registration

and later:

scope deletion
    |
    +-- retrieval cache cleanup
    +-- scoped directory cleanup

Thus the old application-level DocumentService is being replaced conceptually by ScopedKnowledgeService, while DocumentStorage remains useful as an internal storage primitive.

8. Scope Registry

The planned scope_registry.py separates scope metadata/lifecycle from the higher-level scoped knowledge orchestration.

A scope may look conceptually like:

data/scoped/<scope_id>/
    manifest.json
    documents/
    vector/
    pageindex/

The registry is responsible for operations such as:

register(scope)
get(scope_id)
delete(scope_id)

The manifest records enough information to locate the scoped resources.

This separation is intentional:

Scope Registry
    = scope metadata + lifecycle

ScopedKnowledgeService
    = orchestration of document -> knowledge scope

9. Scoped Indexing

There is currently an existing ScopedIndex implementation under the knowledge indexing area.

Its current responsibility is conceptually:

documents
   |
   v
EmbeddingPipeline.chunk_documents()
   |
   v
FaissVectorStore.build_from_documents()

It creates a vector index specifically for the scope.

This component is relevant to the scoped indexing pipeline even if the current higher-level scope orchestration does not yet call it directly.

It should not be deleted merely because it is not currently wired into ChatService; first reconcile it with the final scoped indexing service.

10. KnowledgeDocument

app/knowledge/document.py defines the stored-document representation:

@dataclass(frozen=True)
class KnowledgeDocument:
    document_id: str
    filename: str
    path: Path
    content_type: str | None

It represents a document after storage and provides a stable object for downstream services.

It is particularly useful as the return value of document storage:

UploadFile
   |
   v
DocumentStorage.save()
   |
   v
KnowledgeDocument

It can then be used to create higher-level scoped knowledge metadata.

11. Shared MCP Server

app/mcp/shared/server.py exposes shared capabilities.

The important tools are:

search_knowledge

Searches application knowledge.

search_web

Searches the public web using Tavily.

The shared MCP server is deliberately generic rather than tied to one specific agent.

12. Knowledge MCP Tool

The knowledge search flow is conceptually:

LLM
 |
 v
search_knowledge(query, method, scope_id)
 |
 v
knowledge_search(...)
 |
 +--> Global RAG
 |
 +--> Scoped RAG if scope_id exists

The important security/correctness principle is that scope_id is known by the application and should not be generated or guessed by the LLM.

13. Existing Tool Binding Architecture

The application already has:

app/agent/tool_binding.py

with:

bind_context_arg(
    tool,
    arg_name,
    context_key,
)

This removes a caller-known argument from the LLM-visible tool schema and injects it from agent_context at execution time.

It is already used by the WhatsApp agent for:

conversation_id

The same mechanism should be reused for:

knowledge_scope_id

rather than creating a second, specialized knowledge-tool wrapper.

Conceptually:

LLM
 |
 | search_knowledge(query)
 v
bind_context_arg()
 |
 | inject scope_id
 v
search_knowledge(query, scope_id)

This preserves the existing architecture.

14. BaseAgent and Knowledge Propagation

BaseAgent.invoke() receives:

knowledge: KnowledgeContext | None

and places it into the request context.

The intended propagation is:

ChatService
   |
   v
AgentService
   |
   v
AgentRouter
   |
   v
BaseAgent.invoke()
   |
   v
KnowledgeContext
   |
   v
agent_context
   |
   v
bind_context_arg()
   |
   v
MCP search_knowledge

The LLM never needs to know the actual scope ID.

15. Scoped Retrieval Cache

A scoped retriever can maintain a mapping conceptually like:

_retrievers

scope-A  --> RAGSearch instance
scope-B  --> RAGSearch instance
scope-C  --> RAGSearch instance

This allows a previously created retrieval object to be reused for subsequent searches of the same active scope.

It is an in-memory cache, not the persistent scoped index itself.

The persistent index belongs on disk under the scope directory.

Therefore:

Persistent data
    = scoped FAISS/index files

Runtime cache
    = RAGSearch instances in _retrievers

These should not be confused.

16. Important RAG Lifecycle Consideration

The current RAGSearch implementation contains fallback behavior that loads global documents when no documents are supplied.

That behavior is useful for global RAG.

However, scoped retrieval must be careful not to accidentally rebuild the global index.

The safe invariant is:

Global RAG
    -> may load global documents and build/load global index

Scoped RAG
    -> must use the scoped index associated with scope_id
    -> must not fall back to global document loading because a scope was missing

At the current architecture checkpoint, this distinction must be verified against the actual RAGSearch and FaissVectorStore implementation before making unnecessary changes.

17. Chunking Consideration

There is an existing scoped indexing path where:

EmbeddingPipeline.chunk_documents()

is called before:

FaissVectorStore.build_from_documents()

If FaissVectorStore.build_from_documents() also chunks internally, that creates a double-chunking problem.

The architecture should have exactly one authoritative chunking stage:

documents
    |
    v
chunking
    |
    v
chunks
    |
    v
embedding/indexing

The final implementation should ensure that build_from_documents() either:

accepts already-created chunks, or

owns chunking itself,

but not both simultaneously.

This is an implementation detail that must be reconciled with the actual vectorstore code.

18. Web Search and Async Architecture

Tavily is network I/O, so the application should use Tavily's asynchronous client where supported:

async search_web()
       |
       v
Async Tavily client
       |
       v
await search(...)

Local RAG operations such as FAISS/BM25 search can remain synchronous if they are local operations and do not perform blocking network I/O.

Thus it is acceptable for:

knowledge_search() -> sync
search_web()       -> async

provided expensive blocking CPU work is not allowed to monopolize the async event loop.

19. Temporary Scope Lifetime — Important Design Decision

A temporary scope should not automatically be assumed to live only for one HTTP request.

There are two possible products:

Request-scoped upload

upload
  |
  v
query
  |
  v
delete scope

This is suitable for one-shot document analysis.

Conversation/session-scoped upload

upload
  |
  v
scope_id
  |
  +--> query 1
  |
  +--> query 2
  |
  +--> query 3
  |
  v
explicit expiration / cleanup

This is better if the user expects to ask multiple questions about the same uploaded document.

The current ChatService cleanup pattern deletes the scope in finally, which means the scope disappears as soon as that request completes. Therefore, if multi-turn document conversations are a product requirement, the scope lifetime must be moved outside the individual query request.

This decision should be made before finalizing deletion behavior.

20. PageIndex Preparation

The architecture should leave room for PageIndex without making it part of the current retrieval path prematurely.

A suitable future structure is:

scope/
    manifest.json
    documents/
    vector/
    pageindex/

Current system:

document
   |
   +--> vector/BM25 retrieval

Future system can add:

document
   |
   +--> vector/BM25 retrieval
   |
   +--> PageIndex tree

The scope registry and manifest are therefore useful architectural foundations for later PageIndex incorporation.

21. Current Architectural Principles

The project is following these principles:

Global knowledge is persistent.

Uploaded knowledge is isolated by scope_id.

ChatService should orchestrate the request, not implement storage/indexing details.

DocumentStorage handles physical document persistence.

ScopedKnowledgeService owns temporary knowledge lifecycle.

ScopeRegistry owns scope metadata/lifecycle.

RAG retrieval should not rebuild indexes during normal search.

LLMs should not be trusted with caller-known identifiers such as scope IDs.

Existing bind_context_arg() should be reused for MCP context propagation.

Tavily network calls should be asynchronous.

PageIndex should be added as a future scoped knowledge capability rather than replacing the current RAG pipeline.

22. Current Target Architecture

                    ┌─────────────────────┐
                    │     ChatService     │
                    └──────────┬──────────┘
                               │
                               v
                    ┌─────────────────────┐
                    │ ScopedKnowledge     │
                    │      Service        │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              v                v                v
       DocumentStorage       Loader          Indexer
              │                │                │
              v                v                v
          File data          Chunks       FAISS/BM25
                                               │
                                               v
                                        ScopeRegistry
                                               │
                                               v
                                          scope_id
                                               │
                                               v
                                      KnowledgeContext
                                               │
                                               v
                                           BaseAgent
                                               │
                                               v
                                        agent_context
                                               │
                                               v
                                      bind_context_arg
                                               │
                                               v
                                      Shared MCP Tool
                                               │
                              ┌────────────────┴───────────────┐
                              │                                │
                              v                                v
                         Global RAG                       Scoped RAG
                              │                                │
                              └────────────────┬───────────────┘
                                               v
                                            LLM

23. Next Implementation Priority

Before deleting existing knowledge/indexing files or changing RAGSearch, inspect and reconcile the actual current implementations of:

app/knowledge/retrieval/hybrid.py
app/knowledge/indexing/vectorstore.py
app/knowledge/indexing/embeddings.py
app/knowledge/indexing/scope_indexing.py
app/services/document_service.py
app/knowledge/scoped.py (or its renamed replacement)

The key questions are:

Who currently owns chunking?

Who currently owns FAISS index construction?

Who loads an existing FAISS index?

Is scoped indexing actually wired into the current request path?

Is DocumentService still referenced anywhere?

Is KnowledgeDocument still returned by active code?

What lifetime is intended for a scope?

Only after these are established should unused files be removed.