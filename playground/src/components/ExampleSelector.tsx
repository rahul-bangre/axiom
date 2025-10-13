import { examples } from "../lib/examples";

interface ExampleSelectorProps {
  onSelectExample: (exampleName: string) => void;
}

export function ExampleSelector({ onSelectExample }: ExampleSelectorProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = parseInt(event.target.value, 10);
    if (selectedIndex >= 0) {
      onSelectExample(examples[selectedIndex].name);
    }
  };

  return (
    <select onChange={handleChange} className="example-selector" defaultValue="">
      <option value="" disabled>
        Load Template...
      </option>
      {examples.map((example, index) => (
        <option key={index} value={index}>
          {example.name}
        </option>
      ))}
    </select>
  );
}
