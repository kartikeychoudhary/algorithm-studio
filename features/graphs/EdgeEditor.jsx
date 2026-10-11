import NumberField from "../../components/ui/NumberField.jsx";
export default function EdgeEditor({ edges, nodes, onChange, directed }) {
  return (
    <details className="edge-editor">
      <summary>
        Edit {directed ? "flights and fares" : "edges and weights"}{" "}
        <span>{edges.filter((e) => e.enabled !== false).length} active</span>
      </summary>
      <div className="edge-editor-grid">
        {edges.map((edge, i) => {
          const label = `${nodes[edge.from].label} to ${nodes[edge.to].label}`;
          return (
            <div key={i} className="edge-editor-row">
              <input
                type="checkbox"
                checked={edge.enabled !== false}
                onChange={(e) => onChange(i, { enabled: e.target.checked })}
                aria-label={`Enable ${label}`}
              />
              <span>
                {nodes[edge.from].label} → {nodes[edge.to].label}
              </span>
              <NumberField
                value={edge.weight}
                label={`Cost ${label}`}
                onChange={(weight) => onChange(i, { weight })}
              />
            </div>
          );
        })}
      </div>
      <p>
        Positive integer costs. Disable edges to create disconnected examples.
      </p>
    </details>
  );
}
