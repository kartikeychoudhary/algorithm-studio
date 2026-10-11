export function Panel({ eyebrow, title, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <span className="overline">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function LearningStrip({ children, tag }) {
  return (
    <div className="learning-strip">
      <span className="strip-icon">✳</span>
      <p>{children}</p>
      {tag && <span className="pill">{tag}</span>}
    </div>
  );
}
