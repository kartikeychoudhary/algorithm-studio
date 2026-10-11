import { formatValue } from "../../lib/format.js";

export default function VariableWatch({ variables }) {
  return (
    <div className="watch-panel">
      <span className="overline">LIVE VARIABLES</span>
      <div className="watch-values">
        {Object.entries(variables).map(([name, value]) => (
          <span key={name}>
            {name}
            <b>{formatValue(value)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
