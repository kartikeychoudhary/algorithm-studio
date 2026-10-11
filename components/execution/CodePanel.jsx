export default function CodePanel({ code, event }) {
  return (
    <div className="code-window">
      <div className="code-window-bar">
        <span>
          <i />
          <i />
          <i />
        </span>
        <strong>LIVE PSEUDOCODE</strong>
        <span>line {event.line + 1}</span>
      </div>
      <ol className="code-lines">
        {code.map((line, i) => (
          <li
            key={i}
            className={i === event.line ? "executing" : ""}
            aria-current={i === event.line ? "step" : undefined}
          >
            <span>{i + 1}</span>
            <code>{line}</code>
            {i === event.line && <b aria-hidden="true">←</b>}
          </li>
        ))}
      </ol>
    </div>
  );
}
