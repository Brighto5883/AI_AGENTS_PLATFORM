



























BETTER CONSTITUENTS OF A NEW AI PROMPT
    1. Project tree.
    2. .md files.



    PROBLEMS AT PROBLEM OR LATER SCALING
1.(/backend/app/knowledge/storage.py) - For production I would go one step further: validate the resolved final path is still underneath self.root and ensure document_id 
itself cannot contain path traversal - THis is in the saving of the user uploaded file.
2.(backend/app/knowledge/retrieval/scoped.py) - There is still a production scaling consideration: many concurrent scopes could mean many cached models/indexes. We'll address eviction later. For the current architecture, this is an appropriate first implementation.
3.syncronous MCP knowledge_search tool - One caveat: if local embedding inference becomes extremely expensive, synchronous CPU work inside an async MCP server can still block that MCP event loop. We don't need to prematurely complicate that, but it's something we'll monitor.
4.Change 'typeCheckingMode = "standard"' to 'typeCheckingMode = "strict"' in ./pyrightconfig.json.
 
