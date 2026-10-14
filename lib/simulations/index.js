import { databaseModels } from "./database.js";
import { runtimeModels } from "./runtime.js";
import { networkModels } from "./network.js";
import { distributedModels } from "./distributed.js";
import { toolingModels } from "./tooling.js";
import { aiModels } from "./ai.js";
import { springModels } from "./spring.js";
export const models = {
  ...databaseModels,
  ...runtimeModels,
  ...networkModels,
  ...distributedModels,
  ...toolingModels,
  ...aiModels,
  ...springModels,
};
export function runSystems(id, input) {
  if (!models[id]) throw new Error("Unknown lesson.");
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Input must be a JSON object.");
  return models[id](input);
}
