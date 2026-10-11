/** Copy at the boundary so rewinding never observes later mutations. */
export function recorder(code) {
  const events = [];
  return {
    events,
    code,
    emit(line, message, state) {
      events.push(structuredClone({ line, message, ...state }));
    },
    finish(result) {
      return { code, events, result };
    },
  };
}
