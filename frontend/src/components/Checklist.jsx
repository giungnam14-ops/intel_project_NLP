function Checklist({ items }) {
  return (
    <ul className="checklist-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="checklist-item">
          <label className="check-item">
            <input type="checkbox" defaultChecked={index < 2} />
            <span>{item}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

export default Checklist;
