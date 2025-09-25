import env from './config/env.js';
import createApp from './app.js';
import {
  hasBlockingStartupFailure,
  logStartupCheckResults,
  performStartupChecks,
  registerProcessEventHandlers,
} from './config/runtimeChecks.js';

registerProcessEventHandlers();

const startupResults = performStartupChecks();
logStartupCheckResults(startupResults);

if (hasBlockingStartupFailure(startupResults)) {
  console.error('Aborting startup because one or more critical checks failed.');
  process.exit(1);
}

try {
  const app = createApp();

  app.listen(env.port, () => {
    console.log(`Shopping Cart API listening on port ${env.port}`);
  });
} catch (error) {
  console.error('Failed to start Shopping Cart API:', error);
  process.exit(1);
}
