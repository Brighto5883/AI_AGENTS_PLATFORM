import uvicorn

if __name__ == '__main__':
    uvicorn.run('app.app:api',host='0.0.0.0', port=8000, reload=True)


























# from src.search import RAGSearch
# from src.vectorlessRAG import vectorless_rag, get_pageindex_tree

# def main():
#     print("========== Kenya Road Design Agent ==========")
#     print("\nSelect RAG method:")
#     print("  1. Hybrid RAG  (Vector + BM25 — fast, cost efficient)")
#     print("  2. VectorLess RAG (Full document context — thorough but slower)")

#     choice = input("\nEnter 1 or 2: ").strip()

#     query = input("\nAsk a question: ").strip()

#     if not query:
#         print("[ERROR] No question entered. Exiting.")
#         return

#     if choice == "1":
#         print("\n[INFO] Running Hybrid RAG...")
#         rag_search = RAGSearch()
#         response, total_cost = rag_search.search_and_summarize(query=query, top_k=5)

#     elif choice == "2":
#         print("\n[INFO] Running VectorLess RAG...")
#         tree = get_pageindex_tree()
#         answer = vectorless_rag(query=query, tree=tree)

#     else:
#         print("[ERROR] Invalid choice. Please enter 1 or 2.")
#         return

#     print("\n========== Answer ==========")
#     if choice == "1":
#         print(f"Answer: {response}")
#         print(f"Cost: ${total_cost:.6f}")
#     elif choice == "2":
#         print(f"Answer: {answer}")



# if __name__ == "__main__":
#     main()






















# from src.search import RAGSearch                                    - For Vector RAG
# from src.vectorlessRAG import vectorless_rag, get_pageindex_tree    - For Vectorless RAG


# def main():

#           VECTOR RAG:
#     # print("========== Kenya Road Design Agent ==========")

#     # rag_search = RAGSearch()

#     # query = input("\nAsk a question: ")

#     # summary = rag_search.search_and_summarize(query=query, top_k=5)

#     # print("\nAnswer:", summary)

#         VECTORLESS RAG:
#     print("========== Kenya Road Design Agent ==========")

#     query = input("\nAsk a question: ")

#     tree = get_pageindex_tree()

#     answer = vectorless_rag(query=query, tree=tree)

#     print("\nAnswer:", answer)

# if __name__ == "__main__":
#     main()