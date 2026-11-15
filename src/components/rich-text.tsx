export function RichText({ text }: { text: string }) {
  const blocks: { type: "h2" | "p" | "ul"; content: string[] }[] = [];
  let list: string[] | null = null;
  const flushList = () => {
    if (list) {
      blocks.push({ type: "ul", content: list });
      list = null;
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      blocks.push({ type: "h2", content: [line.slice(3)] });
    } else if (line.startsWith("- ")) {
      list ??= [];
      list.push(line.slice(2));
    } else {
      flushList();
      blocks.push({ type: "p", content: [line] });
    }
  }
  flushList();
  return (
    <div className="prose">
      {blocks.map((block, index) => {
        if (block.type === "h2") return <h2 key={index}>{block.content[0]}</h2>;
        if (block.type === "ul")
          return (
            <ul key={index}>
              {block.content.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        return <p key={index}>{block.content[0]}</p>;
      })}
    </div>
  );
}
