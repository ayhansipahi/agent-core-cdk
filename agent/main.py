"""Minimal Strands agent on AgentCore Runtime.

Entrypoint follows the AgentCore Python SDK contract: BedrockAgentCoreApp +
@app.entrypoint decorator. Local dev: `agentcore dev` (port 8080).
"""
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands.models import BedrockModel

app = BedrockAgentCoreApp()

model = BedrockModel(
    model_id="eu.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region_name="eu-central-1",
)
agent = Agent(model=model)


@app.entrypoint
def invoke(payload, context):
    user_message = payload.get("prompt", "Hello!")
    response = agent(user_message)
    return {"result": str(response)}


if __name__ == "__main__":
    app.run()
