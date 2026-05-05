"""Minimal Strands agent on AgentCore Runtime.

Entrypoint follows the AgentCore Python SDK contract: BedrockAgentCoreApp +
@app.entrypoint decorator. Local dev: `agentcore dev` (port 8080).
"""
import os

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands.models import BedrockModel

MODEL_ID = os.environ.get("MODEL_ID", "eu.anthropic.claude-sonnet-4-5-20250929-v1:0")
REGION = os.environ.get("AWS_REGION", "eu-central-1")

app = BedrockAgentCoreApp()

model = BedrockModel(model_id=MODEL_ID, region_name=REGION)
agent = Agent(model=model)


@app.entrypoint
def invoke(payload, context):
    user_message = payload.get("prompt", "Hello!")
    response = agent(user_message)
    return {"result": str(response)}


if __name__ == "__main__":
    app.run()
