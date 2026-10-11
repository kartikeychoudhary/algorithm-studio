export default function EventExplanation({ event }) {
  return (
    <div className="event-explanation" role="status">
      <span>LINE {event.line + 1}</span>
      <p>{event.message}</p>
    </div>
  );
}
