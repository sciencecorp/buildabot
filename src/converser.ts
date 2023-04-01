import { ChatAgent } from "./agent";

export const connect = (agent1: ChatAgent, agent2: ChatAgent) => {
  // agent1.onPromptReceived = (prompt: string) => {
  //   agent2.run(prompt);
  // };
  // agent2.onPromptReceived = (prompt: string) => {
  //   agent1.run(prompt);
  // };
  // agent1.onMessageReceived = (hook: any) => {
  //   agent2.onMessageReceived(hook);
  // };
  // agent2.onMessageReceived = (hook: any) => {
  //   agent1.onMessageReceived(hook);
  // };
  // return {
  //   inject: (prompt: string, agentId: number = 0) => {
  //     agentId == 0 ? agent1.onPromptReceived(prompt) : agent2.onPromptReceived(prompt);
  //   },
  // };
};
