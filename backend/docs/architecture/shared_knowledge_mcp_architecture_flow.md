Shared Knowledge + MCP Architecture Flow

Purpose

This document adds the new shared knowledge/MCP architecture to the
existing project architecture documentation.

The goal is to make uploaded documents available as request-scoped
knowledge to whichever agent is executing a request, while keeping:

agent-specific MCP servers responsible for agent-specific
capabilities;

a shared MCP server responsible for capabilities common to multiple
agents;

the knowledge/RAG pipeline independent of any particular agent;

uploaded documents temporary unless they are explicitly persisted as
user knowledge.

1. High-Level Architecture

The platform now has three important layers:

Frontend
   │
   │ multipart/form-data
   │ query + optional file
   ▼
FastAPI API
   │
   ▼
ChatService
   │
   ├── validates request
   ├── creates request-scoped knowledge context
   └── invokes AgentService
           │
           ▼
      AgentRouter
           │
           ▼
       BaseAgent
           │
           ▼
      LangGraph graph
           │
           ├── agent-specific MCP tools
           │
           └── shared MCP tools
                  │
                  ├── knowledge_search
                  │      │
                  │      └── generic knowledge/RAG pipeline
                  │
                  └── web_search
                         │
                         └── Tavily

The important architectural distinction is:

The agent does not directly own the RAG implementation. It owns the
decision to use knowledge retrieval, while the shared MCP server
exposes the retrieval capability.

This allows Road, WhatsApp, Email, and future agents to use the same
knowledge capability without importing the RAG implementation into each
agent.

2. MCP Communication

MCP is not the same thing as FastAPI communication.

The FastAPI process receives the user's HTTP request:

Mobile/Web Client
      │
      │ HTTP
      ▼
FastAPI process

When the agent needs tools, the MCPClient creates an MCP connection to
the configured MCP server.

With the current configuration:

FastAPI / Agent process
        │
        │ MCP
        │
        ▼
MCP server subprocess

For a stdio MCP server, the MCP client starts or communicates with the
MCP server process through standard input/output streams.

Therefore:

HTTP
Frontend ───────────────► FastAPI

MCP
Agent ──────────────────► MCP Server

The MCP server is not normally an HTTP endpoint that FastAPI calls
directly.

The agent's MCP client is the bridge.

3. Shared MCP Server

The architecture should contain both:

shared MCP server

and:

agent-specific MCP servers

An agent can therefore receive tools from multiple MCP servers.

For example:

Road Agent
   │
   ├── shared MCP server
   │      ├── knowledge_search
   │      ├── vectorless_search
   │      └── web_search
   │
   └── road MCP server
          ├── road-specific tools
          └── road-specific resources

Another agent might use:

WhatsApp Agent
   │
   ├── shared MCP server
   │      ├── knowledge_search
   │      └── web_search
   │
   └── WhatsApp MCP server
          └── WhatsApp-specific tools

This creates a clean separation:

Capability               Ownership

Knowledge retrieval      Shared MCP
Web search               Shared MCP
Road engineering tools   Road MCP
WhatsApp tools           WhatsApp MCP
Email tools              Email MCP

4. Knowledge Pipeline Ownership

The existing knowledge implementation lives under:

app/knowledge/
├── indexing/
├── ingestion/
├── pageindex/
└── retrieval/

This is a good location because it is domain infrastructure, not
Road-agent infrastructure.

The pipeline should therefore not be moved into:

app/agents/road_design_agent.py

or permanently tied to:

app/mcp/road/

Instead, the shared MCP layer calls the knowledge package.

Conceptually:

Shared MCP
     │
     ▼
knowledge_search()
     │
     ▼
app.knowledge
     │
     ├── ingestion
     ├── indexing
     ├── retrieval
     └── pageindex

This allows future agents to use the same infrastructure.

5. The Existing Road RAG Refactor

The previous structure contains:

app/mcp/road/tools.py

with functions such as:

hybrid_search()
vectorless_search()

These functions are not inherently Road-specific.

They are knowledge retrieval functions.

Therefore, the architecture should eventually become:

app/mcp/shared/
├── server.py
├── tools.py
└── resources.py

with tools such as:

knowledge_search
vectorless_search
web_search

The Road MCP server should retain only genuinely Road-specific
functionality.

This means the Road server no longer owns the generic RAG
infrastructure.

6. Generic Knowledge Search

The shared MCP tool should conceptually receive:

query
knowledge scope
retrieval strategy

rather than assuming:

Road Agent
Road documents
Road FAISS index

A conceptual request looks like:

knowledge_search(
    query="What are the requirements for pavement foundation?",
    scope=...
)

The knowledge layer then determines which documents/chunks are available
within that scope.

The key concept is:

The query determines what the user wants; the knowledge scope
determines what information the agent is allowed to search.

7. Request-Scoped Uploaded Documents

Uploaded documents should not automatically become part of the global
knowledge base.

Instead:

User request
    │
    ├── query
    │
    └── uploaded file
             │
             ▼
       temporary ingestion
             │
             ▼
       temporary chunks
             │
             ▼
       temporary embeddings/index
             │
             ▼
       request knowledge scope

The agent can then call:

knowledge_search

and the tool searches the appropriate scope.

This prevents one user's uploaded document from accidentally becoming
searchable by another user.

8. Knowledge Scope

knowledge_scope represents the knowledge available to the current
agent invocation.

It should be treated as request-scoped context rather than permanent
agent state.

Conceptually:

knowledge_scope = {
    "request_id": "...",
    "user_id": "...",
    "uploaded_documents": [...],
    "persistent_sources": [...],
}

The exact structure can evolve.

The important principle is that the scope identifies where retrieval
is allowed to search.

For example:

Road request
│
├── Global Road manuals
│
└── User uploaded:
       road_report.pdf

The knowledge tool may search:

global Road knowledge
+
request-specific uploaded document

while another request might have:

global Road knowledge
+
no uploaded document

9. Why the Uploaded File Should Not Immediately Go Into the Global FAISS Store

The existing global store:

faiss_store/
├── faiss.index
├── chunks.pkl
└── metadata.pkl

represents persistent indexed knowledge.

A user upload is different.

Consider:

User uploads 200 MB PDF
        │
        ▼
Index it globally
        │
        ▼
Global vector store grows

If this happens for every request, the system eventually accumulates
documents that users may have used only once.

This creates several problems:

storage growth;

unnecessary embedding computation;

stale documents;

privacy/isolation risks;

difficult deletion;

index maintenance;

potentially expensive backups.

Therefore, a production architecture should distinguish:

Persistent knowledge

Documents intentionally stored for future use.

Global/user knowledge base

Request-scoped knowledge

Documents uploaded for a particular request.

Temporary request knowledge

These should not automatically share the same lifecycle.

10. Request-Scoped Knowledge Lifecycle

A production-oriented flow can be:

1. Receive upload
       │
       ▼
2. Validate file
       │
       ▼
3. Store temporarily
       │
       ▼
4. Ingest
       │
       ▼
5. Chunk
       │
       ▼
6. Embed/index
       │
       ▼
7. Create knowledge scope
       │
       ▼
8. Invoke agent
       │
       ▼
9. Agent calls knowledge_search
       │
       ▼
10. Search request scope
       │
       ▼
11. Generate answer
       │
       ▼
12. Request finishes
       │
       ▼
13. Cleanup temporary artifacts

This gives the uploaded document a clear lifecycle.

11. Persistent User Knowledge

A future feature can explicitly promote a document from temporary
knowledge to persistent knowledge.

For example:

Upload document
     │
     ├── "Use only for this request"
     │        │
     │        └── temporary
     │
     └── "Save to my knowledge"
              │
              └── persistent

This is much better than making every upload permanent.

12. Existing Hybrid Retrieval

The current hybrid pipeline combines:

Vector search
+
BM25
+
Reciprocal Rank Fusion

Conceptually:

query
 │
 ├──────────────► vector search
 │
 └──────────────► BM25
                       │
                       ▼
                 RRF merge
                       │
                       ▼
                 ranked chunks

The implementation currently uses:

RAGSearch

and a persistent FAISS store.

This should become one retrieval strategy available to the generic
knowledge system.

It should not be treated as a Road-only implementation.

13. Existing Vectorless/PageIndex Retrieval

The vectorless pipeline follows a different strategy:

query
 │
 ▼
document tree
 │
 ▼
LLM identifies relevant nodes
 │
 ▼
retrieve selected nodes
 │
 ▼
LLM generates grounded answer

This is also a knowledge retrieval strategy rather than an inherently
Road-specific capability.

Therefore it belongs behind the shared knowledge interface.

Conceptually:

knowledge_search
       │
       ├── hybrid retrieval
       │
       └── vectorless retrieval

The agent can choose the strategy when appropriate, or the shared layer
can select one according to policy.

14. Web Search

Web search is another shared capability.

The architecture becomes:

Shared MCP
   │
   ├── knowledge_search
   │       └── internal knowledge
   │
   └── web_search
           └── Tavily

The distinction is important:

knowledge_search
    = search trusted/internal document knowledge

web_search
    = search current external information

The agent can therefore decide:

"Is the answer likely inside the provided/internal documents?"

or:

"Do I need current information from the web?"

15. Agent Decision Flow

The resulting LangGraph flow can conceptually look like:

START
  │
  ▼
LLM node
  │
  ├── answer directly
  │
  ├── call knowledge_search
  │        │
  │        ▼
  │     knowledge result
  │        │
  │        └──────────────┐
  │                       │
  ├── call web_search     │
  │        │              │
  │        ▼              │
  │     web result        │
  │        │              │
  └───────────────────────┘
              │
              ▼
          LLM node
              │
              ▼
             END

The important point is that the graph does not need to implement the RAG
algorithm itself.

It only orchestrates tool use.

16. BaseAgent Responsibility

BaseAgent should remain responsible for common agent lifecycle
concerns:

BaseAgent
├── LLM
├── MCP client
├── MCP tool loading
├── LangGraph graph
├── invocation
└── request context

It should not contain:

FAISS implementation
BM25 implementation
PageIndex implementation
Tavily implementation

Those belong behind tools/services.

17. Agent-Specific Responsibility

A concrete agent such as:

RoadDesignAgent

should mainly define:

system prompt
agent type
agent-specific MCP servers
agent-specific behavior/configuration

For example:

RoadDesignAgent
   │
   ├── shared MCP
   │      ├── knowledge_search
   │      └── web_search
   │
   └── road MCP
          └── road-specific tools

This keeps the agent focused on its domain rather than infrastructure.

18. Context vs AgentState

The generic AgentState should remain generic.

Agent-specific information such as:

customer phone number

should not be hard-coded into the shared graph state.

Likewise, information that is already carried through invocation context
does not necessarily need to become a graph-state field.

The distinction is:

request context
    = metadata/configuration available during invocation

agent state
    = data that changes and flows through graph execution

This separation becomes increasingly important as more agents are added.

19. Conversation Context

The current invocation already establishes contextual information such
as:

conversation_id
agent_name
history

That information can remain in the invocation context where appropriate.

The graph state should contain only information that the graph actually
needs to pass between nodes.

For example:

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

can remain extremely generic.

Additional generic fields can be introduced when the graph genuinely
needs them.

20. End-to-End Request

The resulting production-style request looks like this:

                    FRONTEND
                       │
                       │ multipart/form-data
                       │
              query + optional file
                       │
                       ▼
                  FASTAPI
                       │
                       ▼
                 ChatService
                       │
             create request scope
                       │
                       ▼
                 AgentService
                       │
                       ▼
                 AgentRouter
                       │
                       ▼
                  BaseAgent
                       │
                       ▼
                 LangGraph
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
       Shared MCP          Agent MCP
              │                 │
       ┌──────┴──────┐          │
       │             │          │
       ▼             ▼          ▼
knowledge_search  web_search  domain tools
       │             │
       ▼             ▼
knowledge layer     Tavily
       │
       ├── persistent knowledge
       │
       └── request-scoped upload

21. The Central Design Principle

The architecture should follow this rule:

Agents decide when a capability is needed; shared infrastructure
implements the capability; MCP exposes the capability to agents.

Therefore:

Agent
  decides
     ↓
MCP tool
  exposes
     ↓
knowledge service
  implements
     ↓
retrieval/indexing/ingestion
  performs the work

This keeps the system modular.

22. What This Architecture Enables

With this separation, adding a new agent becomes much simpler.

For example:

FinancialAgent

can receive:

shared MCP
├── knowledge_search
└── web_search

financial MCP
├── market data
└── financial calculators

while:

RoadAgent

receives:

shared MCP
├── knowledge_search
└── web_search

road MCP
├── road design tools
└── road-specific resources

The same knowledge infrastructure can serve both.

23. Final Conceptual Model

The platform can ultimately be understood as four layers:

┌─────────────────────────────────────────────┐
│                  AGENTS                     │
│ Road / WhatsApp / Email / Future Agents    │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              AGENT ORCHESTRATION            │
│              BaseAgent + LangGraph          │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                    MCP                      │
│ Shared capabilities + agent-specific tools  │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              PLATFORM SERVICES              │
│ Knowledge / Web / Memory / LLM / Database   │
└─────────────────────────────────────────────┘

The uploaded document follows the same principle:

Upload
  ↓
Request scope
  ↓
Knowledge ingestion/indexing
  ↓
Scoped retrieval
  ↓
knowledge_search MCP tool
  ↓
Agent
  ↓
Grounded response
  ↓
Cleanup

This is the foundation for making the platform capable of supporting
many agents without duplicating the same knowledge, search, or web
infrastructure inside every agent.
