import { examples } from "../lib/examples";

interface ExampleSelectorProps {
  onSelectExample: (code: string) => void;
}

export function ExampleSelector({ onSelectExample }: ExampleSelectorProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = parseInt(event.target.value, 10);
    if (selectedIndex >= 0) {
      onSelectExample(examples[selectedIndex].code);
    }
  };

  return (
    <select onChange={handleChange} className="example-selector" defaultValue="">
      <option value="" disabled>
        Load Example...
      </option>
      {examples.map((example, index) => (
        <option key={index} value={index}>
          {example.name}
        </option>
      ))}
    </select>
  );
}
