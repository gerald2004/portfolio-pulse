/** Stand-in for a chart that hasn't been built yet. See the roadmap in README.md. */
export function ChartPlaceholder({ title, todo }: { title: string; todo: string }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="placeholder">TODO: {todo}</div>
    </section>
  );
}
