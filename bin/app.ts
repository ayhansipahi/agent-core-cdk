#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AgentRuntimeStack } from '../lib/agent-runtime-stack';

const app = new cdk.App();

new AgentRuntimeStack(app, 'AgentCoreCdkStack', {
  env: {
    region: 'eu-central-1',
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});
