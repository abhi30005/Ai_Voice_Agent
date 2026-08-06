from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.agent.state import AgentState
from app.services.agent.prompts import get_system_prompt
from app.services.tools.registry import get_agent_tools
from app.services.llm.base import get_llm_provider
from app.services.rag.vector_store import vector_store
from app.core.logging import logger

def build_agent():
    tools = get_agent_tools()
    llm = get_llm_provider()
    
    # Bind tools to LLM
    try:
        llm_with_tools = llm.bind_tools(tools)
    except Exception as e:
        logger.warning(f"Failed to bind tools to LLM (provider might not support it): {e}")
        llm_with_tools = llm

    def call_model(state: AgentState):
        messages = state["messages"]
        context = state.get("context", "")
        
        # Ensure system prompt is first
        sys_msg = SystemMessage(content=get_system_prompt(context))
        
        # If first message is not System, prepend it (simplistic handling)
        if not messages or not isinstance(messages[0], SystemMessage):
            messages = [sys_msg] + messages
        else:
            messages[0] = sys_msg

        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    def should_continue(state: AgentState):
        messages = state["messages"]
        last_message = messages[-1]
        
        if last_message.tool_calls:
            return "tools"
        return END

    def retrieve_context(state: AgentState):
        user_id = state.get("user_id")
        messages = state.get("messages", [])
        
        # Get the latest human message to use as the query
        query = ""
        for msg in reversed(messages):
            if isinstance(msg, HumanMessage):
                query = msg.content
                break
                
        if not user_id or not query:
            logger.info("Retrieve skipped: No user_id or query")
            return {"context": ""}
            
        try:
            logger.info(f"Retrieving context for user_id: {user_id}, query: {query}")
            vs = vector_store.get_langchain_vectorstore(user_id)
            docs = vs.similarity_search(query, k=3)
            context = "\n\n".join([doc.page_content for doc in docs])
            logger.info(f"Retrieved {len(docs)} docs, context length: {len(context)}")
            return {"context": context}
        except Exception as e:
            logger.error(f"Retrieval error: {e}", exc_info=True)
            return {"context": ""}

    workflow = StateGraph(AgentState)
    
    workflow.add_node("retrieve", retrieve_context)
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", ToolNode(tools))
    
    workflow.set_entry_point("retrieve")
    workflow.add_edge("retrieve", "agent")
    workflow.add_conditional_edges("agent", should_continue, ["tools", END])
    workflow.add_edge("tools", "agent")
    
    app = workflow.compile()
    return app

agent_app = build_agent()
