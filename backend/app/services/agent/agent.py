from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.agent.state import AgentState
from app.services.agent.prompts import get_system_prompt
from app.services.tools.registry import get_agent_tools
from app.services.llm.base import get_llm_provider
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

    workflow = StateGraph(AgentState)
    
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", ToolNode(tools))
    
    workflow.set_entry_point("agent")
    workflow.add_conditional_edges("agent", should_continue, ["tools", END])
    workflow.add_edge("tools", "agent")
    
    app = workflow.compile()
    return app

agent_app = build_agent()
