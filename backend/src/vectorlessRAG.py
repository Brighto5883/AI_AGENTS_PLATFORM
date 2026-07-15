import os, json
from pageindex import PageIndexClient
from langchain.agents import create_agent
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from .pageindex_utils import get_document_id
from pydantic import BaseModel, Field
from litellm.cost_calculator import cost_per_token

load_dotenv()

PAGEINDEX_API_KEY = os.getenv('PAGEINDEX_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

pi_client = PageIndexClient(api_key=PAGEINDEX_API_KEY)
model1 = ChatGroq(model='qwen/qwen3-32b') # qwen/qwen3.6-27b
model2 = ChatGroq(model='llama-3.3-70b-versatile')

class TreeSearchResult(BaseModel):
    thinking: str = Field(
        description="Reasoning for selecting the nodes"
    )

    node_list: list[str] = Field(
        description="Relevant node IDs"
    )

structured_model = model1.with_structured_output(
    TreeSearchResult,
     method="json_mode"
     )
# agent1 = create_agent(
#     model = model1,
#     system_prompt="""
#     You are a specialized AI assistant for Kenya road design.
#     Use the tools below to answer questions accurately.
#     """
# )

agent2 = create_agent(
    model = model2,
    system_prompt="""
    You are a specialized AI assistant for Kenya road design.
    Use the tools below to answer questions accurately.
    """
)

PDF_PATH = 'data/RDM 3.1 Ground Investigations and Material Prospecting.pdf'
doc_id = get_document_id(PDF_PATH)

# Fetch the full tree
def get_pageindex_tree():
    tree_result = pi_client.get_tree(doc_id, node_summary=True)
    return tree_result.get("result", [])

# ======================================================================================================

# ── LLM Tree Search Function ─────────────────────────────────────────────────

def llm_tree_search(query: str, tree: list) -> dict:
    """
    Core PageIndex retrieval:
    Sends the query + document tree to an LLM.
    LLM reasons over the structure and returns relevant node_ids.
    
    Returns: dict with 'thinking' (reasoning) and 'node_list' (node IDs)
    """

    # Compress tree to save tokens — only send titles + short summaries
    def compress(nodes):
        out = []
        for n in nodes:
            entry = {
                "node_id": n["node_id"],
                "title":   n["title"],
                "page":    n.get("page_index", "?"),
                "summary": n.get("text", "")[:150]  # first 150 chars
            }
            if n.get("nodes"):
                entry["children"] = compress(n["nodes"])
            out.append(entry)
        return out

    compressed_tree = compress(tree)

    prompt = f"""You are given a query and a document's tree structure (like a Table of Contents).
    Your task: identify which node IDs most likely contain the answer to the query.
    Think step-by-step about which sections are relevant.

    Query: {query}

    Document Tree:
    {json.dumps(compressed_tree, indent=2)}

    Reply ONLY in this exact JSON format:
    {{
    "thinking": "<your step-by-step reasoning>",
    "node_list": ["node_id1", "node_id2"]
    }}"""   


    # Sending the Prompt to agent to return relevane node_ids
    result = structured_model.invoke(prompt)

    return result.model_dump()


# ======================================================================================================
# FULL END-TO-END RAG PIPELINE

# ── Helper: Find nodes by ID ─────────────────────────────────────────────────
def find_nodes_by_ids(tree: list, target_ids: list) -> list:
    """Recursively walk the tree and collect nodes matching target_ids."""
    found = []
    for node in tree:
        if node["node_id"] in target_ids:
            found.append(node)
        if node.get("nodes"):
            found.extend(find_nodes_by_ids(node["nodes"], target_ids))
    return found


# ======================================================================================================

# ── Generate answer from retrieved nodes ─────────────────────────────────────

def generate_answer(query: str, nodes: list) -> str:
    """
    Takes retrieved nodes as context and generates a grounded answer.
    Instructs the LLM to cite section titles and page numbers.
    """
    if not nodes:
        return (
            "⚠️ No relevant sections found in the document.",
            "",
            0.0,
        )
    
    # Build context string from retrieved nodes
    context_parts = []
    for node in nodes:
        context_parts.append(
            f"[Section: '{node['title']}' | Page {node.get('page_index', '?')}]\n"
            f"{node.get('text', 'Content not available.')}"
        )
    context = "\n\n---\n\n".join(context_parts)
    
    prompt = f"""You are an expert document analyst.
    Answer the question using ONLY the provided context.
    For every claim you make, cite the section title and page number in parentheses.
    Be concise and precise.

    Question: {query}

    Context:
    {context}

    Answer:"""
    
    response = agent2.invoke(
        {'messages':[{'role':'user',
                      'content': prompt}]}
    )

    ai_message = response["messages"][-1]

    usage = ai_message.usage_metadata

    input_tokens = usage["input_tokens"]
    output_tokens = usage["output_tokens"]

    print(ai_message.response_metadata)
    print(ai_message.usage_metadata)
    model = ai_message.response_metadata["model"]

    try:
        prompt_cost, completion_cost = cost_per_token(
            model=model,
            prompt_tokens=input_tokens,
            completion_tokens=output_tokens,
        )

        total_cost = prompt_cost + completion_cost

    except Exception:
        total_cost = 0.0

    documents = list({
        node["source"]
        for node in nodes
        if "source" in node
    })

    document = ", ".join(documents)

    return (
        ai_message.content,
        document,
        total_cost,
    )

# ======================================================================================================

# ── The complete Vectorless RAG function ─────────────────────────────────────

def vectorless_rag(query: str, tree: list) -> str: # Verbose: bool=True can be used to display different function level outputs
    """
    Full end-to-end PageIndex RAG pipeline:
    
    Step 1: LLM Tree Search  → finds relevant node_ids
    Step 2: Node Retrieval   → fetches section content
    Step 3: Answer Generation → produces cited answer
    """
    # Step 1: Tree Search
    search_result  = llm_tree_search(query, tree)
    node_ids       = search_result.get("node_list", [])
    
    # Step 2: Retrieve nodes
    nodes = find_nodes_by_ids(tree, node_ids)
    
    # Step 3: Generate answer
    answer, document, cost = generate_answer(query, nodes)
    
    return answer, document, cost
