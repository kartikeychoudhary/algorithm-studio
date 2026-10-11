export default function ProblemContext({ lesson }) {
  const problem = lesson.problem;
  return (
    <section className="problem-context" aria-label="Practice problem">
      <div className="problem-heading">
        <span className="overline">PRACTICE THE PATTERN</span>
        <a href={problem.url} target="_blank" rel="noreferrer">
          LeetCode {problem.number} ↗
        </a>
      </div>
      <h3>{problem.name}</h3>
      <p>{problem.task}</p>
      <details className="worked-example">
        <summary>Example input & expected output</summary>
        <dl className="example-io">
          <div>
            <dt>Input</dt>
            <dd>
              <code>
                {problem.input} ={" "}
                {lesson.edges || JSON.stringify(lesson.values)}
                {lesson.parameter
                  ? `\n${problem.parameter} = ${lesson.parameter.value}`
                  : ""}
              </code>
            </dd>
          </div>
          <div>
            <dt>Expected output</dt>
            <dd>
              <code>{JSON.stringify(problem.expected)}</code>
            </dd>
          </div>
        </dl>
        <p>{problem.explanation}</p>
      </details>
    </section>
  );
}
