import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as agentcore from '@aws-cdk/aws-bedrock-agentcore-alpha';
import * as path from 'path';

const MODEL_ID = 'anthropic.claude-sonnet-4-5-20250929-v1:0';
const INFERENCE_PROFILE_ID = `eu.${MODEL_ID}`;

export class AgentRuntimeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const artifact = agentcore.AgentRuntimeArtifact.fromCodeAsset({
      path: path.join(__dirname, '..', 'agent', 'dist'),
      runtime: agentcore.AgentCoreRuntime.PYTHON_3_13,
      entrypoint: ['main.py'],
    });

    const runtime = new agentcore.Runtime(this, 'AgentRuntime', {
      runtimeName: 'helloAgent',
      agentRuntimeArtifact: artifact,
      description: 'Minimal Strands agent on AgentCore Runtime (CDK quickstart) v2',
    });

    runtime.role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        sid: 'BedrockInvokeModel',
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/${MODEL_ID}`,
          `arn:aws:bedrock:*::foundation-model/${MODEL_ID}`,
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/${INFERENCE_PROFILE_ID}`,
        ],
      }),
    );

    // Bedrock validates the caller's AWS Marketplace subscription for Anthropic
    // models on each ConverseStream call. Without these the runtime role gets
    // 500 AccessDeniedException after the initial cached window.
    runtime.role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        sid: 'BedrockMarketplaceSubscriptionCheck',
        actions: [
          'aws-marketplace:Subscribe',
          'aws-marketplace:Unsubscribe',
          'aws-marketplace:ViewSubscriptions',
        ],
        resources: ['*'],
      }),
    );

    new cdk.CfnOutput(this, 'AgentRuntimeArn', {
      value: runtime.agentRuntimeArn,
      description: 'ARN of the AgentCore Runtime — pass to scripts/invoke.py',
    });
  }
}
