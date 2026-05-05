import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as agentcore from '@aws-cdk/aws-bedrock-agentcore-alpha';
import * as path from 'path';

export interface AgentRuntimeStackProps extends cdk.StackProps {
  readonly modelId: string;
  readonly inferenceProfilePrefix: string;
  readonly runtimeName: string;
  readonly runtimeDescription: string;
}

export class AgentRuntimeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AgentRuntimeStackProps) {
    super(scope, id, props);

    const inferenceProfileId = `${props.inferenceProfilePrefix}.${props.modelId}`;

    const artifact = agentcore.AgentRuntimeArtifact.fromCodeAsset({
      path: path.join(__dirname, '..', 'agent', 'dist'),
      runtime: agentcore.AgentCoreRuntime.PYTHON_3_13,
      entrypoint: ['main.py'],
    });

    const runtime = new agentcore.Runtime(this, 'AgentRuntime', {
      runtimeName: props.runtimeName,
      agentRuntimeArtifact: artifact,
      description: props.runtimeDescription,
    });

    runtime.role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        sid: 'BedrockInvokeModel',
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/${props.modelId}`,
          `arn:aws:bedrock:*::foundation-model/${props.modelId}`,
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/${inferenceProfileId}`,
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

    cdk.Tags.of(this).add('Project', 'agent-core-cdk');
    cdk.Tags.of(this).add('ManagedBy', 'cdk');
  }
}
