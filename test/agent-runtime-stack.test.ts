import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { AgentRuntimeStack } from '../lib/agent-runtime-stack';

const TEST_PROPS = {
  modelId: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
  inferenceProfilePrefix: 'eu',
  runtimeName: 'helloAgent',
  runtimeDescription: 'Test runtime',
  env: { account: '123456789012', region: 'eu-central-1' },
};

// fromCodeAsset() requires the asset path to exist. Stub a minimal dist so
// the test is self-contained and can run without `npm run build-agent`.
const distDir = path.join(__dirname, '..', 'agent', 'dist');
beforeAll(() => {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  const stubFile = path.join(distDir, 'main.py');
  if (!fs.existsSync(stubFile)) {
    fs.writeFileSync(stubFile, '# test stub\n');
  }
});

function synthStack(): Template {
  const app = new cdk.App();
  const stack = new AgentRuntimeStack(app, 'TestStack', TEST_PROPS);
  return Template.fromStack(stack);
}

describe('AgentRuntimeStack', () => {
  it('creates exactly one AgentCore Runtime resource', () => {
    const template = synthStack();
    const runtimes = template.findResources('AWS::BedrockAgentCore::Runtime');
    expect(Object.keys(runtimes)).toHaveLength(1);
  });

  it('configures the runtime with the provided runtime name', () => {
    const template = synthStack();
    template.hasResourceProperties(
      'AWS::BedrockAgentCore::Runtime',
      Match.objectLike({
        AgentRuntimeName: 'helloAgent',
      }),
    );
  });

  it('grants the runtime role bedrock InvokeModel via the BedrockInvokeModel statement', () => {
    const template = synthStack();
    template.hasResourceProperties(
      'AWS::IAM::Policy',
      Match.objectLike({
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'BedrockInvokeModel',
              Action: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
            }),
          ]),
        }),
      }),
    );
  });

  it('grants the runtime role aws-marketplace subscription-check actions on *', () => {
    const template = synthStack();
    template.hasResourceProperties(
      'AWS::IAM::Policy',
      Match.objectLike({
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'BedrockMarketplaceSubscriptionCheck',
              Action: [
                'aws-marketplace:Subscribe',
                'aws-marketplace:Unsubscribe',
                'aws-marketplace:ViewSubscriptions',
              ],
              Resource: '*',
            }),
          ]),
        }),
      }),
    );
  });

  it('exposes the AgentRuntimeArn as a stack output', () => {
    const template = synthStack();
    template.hasOutput('AgentRuntimeArn', {});
  });

  it('tags the runtime with Project and ManagedBy', () => {
    const template = synthStack();
    const runtimes = template.findResources('AWS::BedrockAgentCore::Runtime');
    const [runtime] = Object.values(runtimes);
    const tags = runtime.Properties?.Tags ?? {};
    expect(tags).toMatchObject({
      Project: 'agent-core-cdk',
      ManagedBy: 'cdk',
    });
  });
});
