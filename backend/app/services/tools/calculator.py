from langchain_core.tools import tool
import ast
import operator

@tool
def calculator(expression: str) -> str:
    """Evaluate a mathematical expression."""
    try:
        # Very restricted eval for basic math
        allowed_operators = {
            ast.Add: operator.add, ast.Sub: operator.sub,
            ast.Mult: operator.mul, ast.Div: operator.truediv,
            ast.Pow: operator.pow, ast.BitXor: operator.xor,
            ast.USub: operator.neg
        }
        
        def eval_expr(node):
            if isinstance(node, ast.Num): 
                return node.n
            elif isinstance(node, ast.BinOp):
                return allowed_operators[type(node.op)](eval_expr(node.left), eval_expr(node.right))
            elif isinstance(node, ast.UnaryOp):
                return allowed_operators[type(node.op)](eval_expr(node.operand))
            else:
                raise TypeError(node)
                
        tree = ast.parse(expression, mode='eval').body
        result = eval_expr(tree)
        return str(result)
    except Exception as e:
        return f"Error evaluating expression: {e}"
