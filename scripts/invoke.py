#!/usr/bin/env python3
"""Invoke the deployed AgentCore Runtime via boto3.

Usage:
    python scripts/invoke.py <agent-runtime-arn> "<prompt>"
"""
import json
import os
import sys
import uuid

import boto3

REGION = os.environ.get("AWS_REGION", "eu-central-1")


def main() -> None:
    if len(sys.argv) < 3:
        print('Usage: invoke.py <agent-runtime-arn> "<prompt>"')
        sys.exit(1)

    arn = sys.argv[1]
    prompt = sys.argv[2]

    client = boto3.client("bedrock-agentcore", region_name=REGION)
    response = client.invoke_agent_runtime(
        agentRuntimeArn=arn,
        runtimeSessionId=str(uuid.uuid4()),
        payload=json.dumps({"prompt": prompt}).encode("utf-8"),
    )

    body = response["response"].read()
    try:
        print(json.dumps(json.loads(body), indent=2, ensure_ascii=False))
    except json.JSONDecodeError:
        print(body.decode("utf-8"))


if __name__ == "__main__":
    main()
