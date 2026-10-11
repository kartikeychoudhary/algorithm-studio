export default function KnapsackTable({
  table,
  items,
  current,
  visibleSteps = Infinity,
  onCell,
  dependency,
}) {
  const capacity = table[0].length - 1;
  return (
    <div className="table-scroll">
      <table className="dp-table">
        <thead>
          <tr>
            <th scope="col">Items ↓</th>
            {table[0].map((_, c) => (
              <th scope="col" key={c}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.map((row, i) => (
            <tr key={i}>
              <th scope="row">{i ? items[i - 1].name : "None"}</th>
              {row.map((value, c) => {
                const visible =
                  i === 0 || (i - 1) * (capacity + 1) + c + 1 <= visibleSteps;
                const classes = `dp-cell ${current?.i === i && current?.c === c ? "current" : ""} ${dependency?.i === i && dependency.columns.includes(c) ? "dependency" : ""}`;
                return (
                  <td key={c}>
                    {onCell ? (
                      <button
                        className={classes}
                        onClick={() => onCell(i, c)}
                        aria-label={`${i} items, capacity ${c}: ${visible ? value : "not evaluated"}`}
                      >
                        {visible ? value : "·"}
                      </button>
                    ) : (
                      <span className={`${classes} trace-table-cell`}>
                        {value}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
