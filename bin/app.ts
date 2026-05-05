#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AgentRuntimeStack } from '../lib/agent-runtime-stack';

const app = new cdk.App();

const region = app.node.tryGetContext('agentCore:region') as string;
const modelId = app.node.tryGetContext('agentCore:modelId') as string;
const runtimeName = app.node.tryGetContext('agentCore:runtimeName') as string;
const inferenceProfilePrefix = app.node.tryGetContext(
  'agentCore:inferenceProfilePrefix',
) as string;
const runtimeDescription = app.node.tryGetContext('agentCore:description') as string;

if (!region || !modelId || !runtimeName || !inferenceProfilePrefix || !runtimeDescription) {
  throw new Error(
    'Missing required cdk.json context: agentCore:{region, modelId, runtimeName, inferenceProfilePrefix, description}',
  );
}

new AgentRuntimeStack(app, 'AgentCoreCdkStack', {
  env: {
    region,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  modelId,
  runtimeName,
  inferenceProfilePrefix,
  runtimeDescription,
});
