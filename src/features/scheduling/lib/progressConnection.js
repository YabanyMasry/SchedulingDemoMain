export const buildProgressConnection = (getToken) => {
  const handlers = {};
  let interval;
  
  return {
    on: (event, handler) => { handlers[event] = handler; },
    onreconnecting: () => {},
    onreconnected: () => {},
    invoke: (method, ...args) => Promise.resolve(),
    start: () => {
      // Simulate progress updates for the frontend demo
      let progress = 0;
      interval = setInterval(() => {
        progress += 20;
        if (progress > 100) progress = 100;
        if (handlers['progress']) {
          handlers['progress']({
            progressPercent: progress,
            message: `Mock generation step... [${progress}%]`,
            currentBestScore: Math.random() * 100,
            isComplete: progress === 100,
            errorMessage: null
          });
        }
        if (progress === 100) clearInterval(interval);
      }, 800);
      return Promise.resolve();
    },
    stop: () => {
      clearInterval(interval);
      return Promise.resolve();
    }
  };
};
